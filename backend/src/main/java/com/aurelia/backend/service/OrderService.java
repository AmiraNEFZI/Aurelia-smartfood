package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.CreateOrderRequest;
import com.aurelia.backend.dto.request.SubmitDriverReviewRequest;
import com.aurelia.backend.dto.response.DriverReviewResponse;
import com.aurelia.backend.dto.response.OrderItemResponse;
import com.aurelia.backend.dto.response.OrderResponse;
import com.aurelia.backend.entity.*;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.enums.StatutPaiement;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository   orderRepository;
    private final CartRepository    cartRepository;
    private final UserRepository    userRepository;
    private final ProductRepository productRepository;
    private final PartnerService    partnerService;
    private final AssignationService assignationService;
    private final BrevoService      brevoService;
    private final DriverReviewRepository driverReviewRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // ══════════════════════════════════════════════════════════════════════════
    // Checkout
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Workflow checkout :
     * 1. Récupère le panier du client
     * 2. Vérifie les stocks (Aurelia + partenaires)
     * 3. Crée la commande + OrderItems (snapshot prix/nom, sourcing intelligent)
     * 4. Décrémente les stocks
     * 5. Vide le panier
     * 6. Délègue l'assignation à AssignationService (transaction REQUIRES_NEW)
     */
    @Transactional
    public OrderResponse checkout(String email, CreateOrderRequest request) {
        User client = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        Cart cart = cartRepository.findByUserId(client.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Panier introuvable."));

        if (cart.getItems().isEmpty()) {
            throw new BusinessException("Le panier est vide. Ajoutez des produits avant de commander.");
        }

        List<CartItem> validItems = cart.getItems().stream()
                .filter(item -> item.getProduct() != null)
                .collect(java.util.stream.Collectors.toList());

        if (validItems.isEmpty()) {
            throw new BusinessException(
                "Les produits de votre panier ne sont plus disponibles. Veuillez les supprimer et recommencer.");
        }

        // ── Vérification stocks et calcul total ──
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : validItems) {
            Product product = item.getProduct();
            int qte = item.getQuantity();

            boolean aStockAurelia    = product.getStock() >= qte;
            boolean aStockPartenaire = false;
            try {
                aStockPartenaire = partnerService.isProductAvailableAnywhere(product.getId());
            } catch (Exception e) {
                log.warn("Impossible de vérifier dispo partenaire produit #{}: {}", product.getId(), e.getMessage());
            }

            if (!aStockAurelia && !aStockPartenaire) {
                throw new BusinessException(
                    "Produit indisponible : " + product.getName()
                    + " — ni en stock Aurelia ni chez nos partenaires.");
            }
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(qte)));
        }

        // ── Création commande ──
        Order order = Order.builder()
                .user(client)
                .address(request.getAddress())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(StatutPaiement.EN_ATTENTE)
                .status(StatutCommande.EN_ATTENTE)
                .totalAmount(total)
                .build();

        // ── OrderItems + sourcing ──
        for (CartItem item : validItems) {
            Product product = item.getProduct();
            int qte = item.getQuantity();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(qte)
                    .unitPrice(product.getPrice())
                    .productName(product.getName())
                    .sourceType("AURELIA")
                    .build();

            if (product.getStock() >= qte) {
                product.setStock(product.getStock() - qte);
                productRepository.save(product);
                log.info("Stock Aurelia utilisé pour '{}' (restant: {})", product.getName(), product.getStock());
            } else {
                try {
                    Optional<PartnerProduct> partenaire = partnerService.sourcerProduit(product.getId(), qte);
                    if (partenaire.isPresent()) {
                        orderItem.setSourceType("PARTENAIRE");
                        orderItem.setSourcePartner(partenaire.get().getPartner());
                        log.info("🔄 Sourcing partenaire '{}' pour '{}'",
                                partenaire.get().getPartner().getName(), product.getName());
                    } else {
                        throw new BusinessException("Produit indisponible : " + product.getName());
                    }
                } catch (BusinessException e) {
                    throw e;
                } catch (Exception e) {
                    log.error("Erreur sourcing partenaire pour '{}': {}", product.getName(), e.getMessage());
                    throw new BusinessException("Erreur lors du traitement de la commande pour : " + product.getName());
                }
            }
            order.getItems().add(orderItem);
        }

        orderRepository.saveAndFlush(order); // flush immédiat pour que REQUIRES_NEW le voie

        // ── Vider le panier ──
        cart.getItems().clear();
        cartRepository.save(cart);

        // ── Amél. 2 : délégation à AssignationService (REQUIRES_NEW) ──
        // L'appel est fait APRÈS le commit de la commande en base pour que
        // AssignationService puisse la voir dans sa propre transaction.
        // La commande est déjà sauvegardée, on peut passer son id en toute sécurité.
        try {
            assignationService.tenterAssignation(order.getId());
        } catch (Exception e) {
            // L'assignation est best-effort : une erreur ici ne doit pas annuler la commande
            log.warn("Assignation immédiate échouée pour commande #{} — le scheduler prendra le relais: {}",
                    order.getId(), e.getMessage());
        }

        try {
            sendOrderConfirmation(order);
        } catch (Exception e) {
            log.warn("Notification commande échouée pour commande #{}: {}", order.getId(), e.getMessage());
        }

        return toResponse(orderRepository.findById(order.getId()).orElse(order));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Lecture
    // ══════════════════════════════════════════════════════════════════════════

    public List<OrderResponse> getMyOrders(String email) {
        User client = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        return orderRepository.findByUserIdOrderByOrderDateDesc(client.getId())
                .stream().map(this::toResponse).toList();
    }

    public OrderResponse getOrderById(Long id, String email) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + id));
        User user = userRepository.findByEmail(email).orElseThrow();

        boolean isAdmin  = user.getRole().name().equals("ADMIN");
        boolean isOwner  = order.getUser().getId().equals(user.getId());
        boolean isDriver = order.getDriver() != null && order.getDriver().getId().equals(user.getId());

        if (!isAdmin && !isOwner && !isDriver) {
            throw new BusinessException("Accès non autorisé à cette commande.");
        }
        return toResponse(order);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<OrderResponse> getMyDeliveries(String email) {
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable."));
        return orderRepository.findByDriverIdOrderByOrderDateDesc(driver.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public DriverReviewResponse submitDriverReview(Long orderId, String email, SubmitDriverReviewRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + orderId));
        User client = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        if (!order.getUser().getId().equals(client.getId())) {
            throw new BusinessException("Vous ne pouvez évaluer que les commandes qui vous appartiennent.");
        }
        if (order.getStatus() != StatutCommande.LIVREE) {
            throw new BusinessException("Cette commande n'est pas encore livrée. L'évaluation sera disponible après livraison.");
        }
        if (driverReviewRepository.existsByOrderId(orderId)) {
            throw new BusinessException("Vous avez déjà évalué cette livraison.");
        }
        if (order.getDriver() == null) {
            throw new BusinessException("Aucun livreur n'a été associé à cette commande.");
        }

        DriverReview review = DriverReview.builder()
                .order(order)
                .client(client)
                .driver(order.getDriver())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        DriverReview saved = driverReviewRepository.save(review);
        return DriverReviewResponse.builder()
                .id(saved.getId())
                .orderId(order.getId())
                .driverId(order.getDriver().getId())
                .driverName(order.getDriver().getFirstName() + " " + order.getDriver().getLastName())
                .rating(saved.getRating())
                .comment(saved.getComment())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Actions admin / livreur
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * ADMIN : assigner manuellement un livreur à une commande.
     * Libère l'ancien livreur si la commande en avait déjà un.
     */
    @Transactional
    public OrderResponse assignDriver(Long orderId, Long driverId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + orderId));
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + driverId));

        // Libère l'ancien livreur s'il y en a un
        if (order.getDriver() != null) {
            assignationService.libererLivreurAnnulation(order.getDriver().getId());
        }

        order.setDriver(driver);
        order.setStatus(StatutCommande.PRISE_EN_CHARGE);
        driver.setStatutLivreur(com.aurelia.backend.enums.StatutLivreur.OCCUPE);
        userRepository.save(driver);

        Order savedOrder = orderRepository.save(order);
        try {
            notifyDriverAssignment(savedOrder, driver);
        } catch (Exception e) {
            log.warn("Notification assignation livreur échouée pour commande #{}: {}", orderId, e.getMessage());
        }

        log.info("Admin: livreur {} assigné manuellement à commande #{}", driver.getEmail(), orderId);
        return toResponse(savedOrder);
    }

    /**
     * Met à jour le statut d'une commande.
     *
     * LIVREE  → libère le livreur (disponibleDepuis = now() → rentre dans la file FIFO).
     * ANNULEE → remet les stocks en place + libère le livreur si assigné.
     */
    @Transactional
    public OrderResponse updateStatus(Long orderId, StatutCommande newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + orderId));

        order.setStatus(newStatus);

        if (newStatus == StatutCommande.LIVREE) {
            order.setPaymentStatus(StatutPaiement.PAYE);
            // Sauvegarde le statut LIVREE en BD AVANT de libérer le livreur
            // Important : saveAndFlush garantit que le scheduler ne voit jamais
            // une commande LIVREE avec l'ancien statut EN_LIVRAISON
            orderRepository.saveAndFlush(order);
            if (order.getDriver() != null) {
                Long driverId = order.getDriver().getId();
                // Libère le livreur APRÈS que LIVREE est commis en BD
                assignationService.libererLivreur(driverId);
            }

            Long deliveredOrderId = order.getId();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        Order freshOrder = orderRepository.findById(deliveredOrderId).orElse(null);
                        if (freshOrder == null) {
                            log.warn("Commande #{} introuvable après commit pour l'envoi du mail de livraison", deliveredOrderId);
                            return;
                        }
                        log.info("Envoi du mail de livraison pour commande #{} au client {}", deliveredOrderId, freshOrder.getUser().getEmail());
                        sendDeliveryCompletedEmail(freshOrder);
                    } catch (Exception e) {
                        log.error("Notification livraison terminée échouée pour commande #{}: {}", deliveredOrderId, e.getMessage(), e);
                    }
                }
            });

            return toResponse(orderRepository.findById(orderId).orElse(order));
        }

        if (newStatus == StatutCommande.ANNULEE) {
            // Remet les stocks
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    product.setStock(product.getStock() + item.getQuantity());
                    productRepository.save(product);
                }
            }
            // Libère le livreur s'il y en a un
            if (order.getDriver() != null) {
                Long driverId = order.getDriver().getId();
                order.setDriver(null);
                orderRepository.saveAndFlush(order);
                assignationService.libererLivreurAnnulation(driverId);
                return toResponse(orderRepository.findById(orderId).orElse(order));
            }
        }

        return toResponse(orderRepository.save(order));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Mapper
    // ══════════════════════════════════════════════════════════════════════════

    public OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(this::toItemResponse).toList();

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .clientName(order.getUser().getFirstName() + " " + order.getUser().getLastName())
                .driverId(order.getDriver() != null ? order.getDriver().getId() : null)
                .driverName(order.getDriver() != null
                        ? order.getDriver().getFirstName() + " " + order.getDriver().getLastName()
                        : null)
                .address(order.getAddress())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .orderDate(order.getOrderDate())
                .items(items)
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .sourceType(item.getSourceType() != null ? item.getSourceType() : "AURELIA")
                .sourcePartnerId(item.getSourcePartner() != null ? item.getSourcePartner().getId() : null)
                .sourcePartnerName(item.getSourcePartner() != null ? item.getSourcePartner().getName() : null)
                .build();
    }

    private void sendOrderConfirmation(Order order) {
        String recipientName = order.getUser().getFirstName() + " " + order.getUser().getLastName();
        String subject = "Confirmation de votre commande #" + order.getId();

        StringBuilder itemListHtml = new StringBuilder();
        StringBuilder itemListText = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            String line = String.format("%s x%d - %s DT", item.getProductName(), item.getQuantity(), item.getUnitPrice());
            itemListHtml.append("<li style=\"margin-bottom:8px;\">\n")
                    .append("<span style=\"color:#1f4f70;\">" + line + "</span>\n</li>");
            itemListText.append("- ").append(line).append("\n");
        }

        String htmlContent = "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f3f7fb;color:#102a43;padding:24px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 35px rgba(16,42,67,0.12);\">"
                + "<div style=\"background:#0f4c75;color:#ffffff;padding:24px;text-align:center;\">"
                + "<h1 style=\"margin:0;font-size:24px;letter-spacing:0.5px;\">Confirmation de votre commande #" + order.getId() + "</h1>"
                + "<p style=\"margin:10px 0 0;font-size:14px;color:#c9d6df;\">Merci d'avoir choisi Aurelia Smart Food 🛒</p>"
                + "</div>"
                + "<div style=\"padding:24px;\">"
                + "<p style=\"margin:0 0 16px;font-size:16px;font-weight:600;color:#102a43;\">Bonjour " + recipientName + ",</p>"
                + "<p style=\"margin:0 0 24px;font-size:14px;color:#334e68;line-height:1.6;\">Votre commande a bien été reçue. Voici le récapitulatif :</p>"
                + "<div style=\"background:#eef6fb;border-radius:14px;padding:18px;margin-bottom:20px;\">"
                + "<strong style=\"display:block;margin-bottom:12px;color:#0b3c5d;\">Détails de la commande</strong>"
                + "<ul style=\"margin:0;padding-left:20px;color:#334e68;\">" + itemListHtml + "</ul>"
                + "</div>"
                + "<p style=\"margin:0 0 6px;font-size:15px;color:#0b3c5d;font-weight:700;\">Total payé :</p>"
                + "<p style=\"margin:0 0 20px;font-size:18px;color:#1f7a8c;font-weight:700;\">" + order.getTotalAmount() + " DT</p>"
                + "<p style=\"margin:0 0 6px;font-size:15px;color:#0b3c5d;font-weight:700;\">Adresse de livraison :</p>"
                + "<p style=\"margin:0 0 24px;font-size:15px;color:#334e68;\">" + order.getAddress() + "</p>"
                + "<div style=\"padding:18px;border-radius:14px;background:#fafbfc;color:#334e68;\">"
                + "<p style=\"margin:0;font-size:14px;\">Nous vous informerons dès que le livreur sera assigné.</p>"
                + "</div>"
                + "</div></div></div>";

        String textContent = "Bonjour " + recipientName + ",\n\n"
                + "Merci pour votre commande. Voici le récapitulatif :\n"
                + itemListText
                + "\nTotal : " + order.getTotalAmount() + " DT\n"
                + "Adresse de livraison : " + order.getAddress() + "\n\n"
                + "Nous vous informerons dès que le livreur sera assigné.\n\n"
                + "Merci d'avoir choisi Aurelia Smart Food !";

        brevoService.sendEmail(order.getUser().getEmail(), recipientName, subject, htmlContent, textContent);
        brevoService.sendSms(order.getUser().getPhone(),
                "Votre commande #" + order.getId() + " a bien été créée. Nous vous préviendrons dès qu'un livreur sera assigné.");
    }

    private void notifyDriverAssignment(Order order, User driver) {
        String recipientName = driver.getFirstName() + " " + driver.getLastName();
        String subject = "Nouvelle commande assignée : #" + order.getId();

        String htmlContent = "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f3f7fb;color:#102a43;padding:24px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 35px rgba(16,42,67,0.12);\">"
                + "<div style=\"background:#1f7a8c;color:#ffffff;padding:24px;text-align:center;\">"
                + "<h1 style=\"margin:0;font-size:24px;\">Nouvelle commande assignée</h1>"
                + "</div>"
                + "<div style=\"padding:24px;\">"
                + "<p style=\"margin:0 0 16px;font-size:16px;font-weight:600;color:#102a43;\">Bonjour " + recipientName + ",</p>"
                + "<p style=\"margin:0 0 18px;font-size:14px;color:#334e68;line-height:1.6;\">Vous avez été assigné à une nouvelle commande. Retrouvez ci-dessous toutes les informations utiles.</p>"
                + "<div style=\"background:#eef6fb;border-radius:14px;padding:18px;margin-bottom:20px;\">"
                + "<p style=\"margin:0 0 10px;font-size:15px;color:#0b3c5d;font-weight:700;\">Commande #" + order.getId() + "</p>"
                + "<p style=\"margin:0 0 6px;font-size:14px;color:#334e68;\"><strong>Client :</strong> " + order.getUser().getFirstName() + " " + order.getUser().getLastName() + "</p>"
                + "<p style=\"margin:0 0 6px;font-size:14px;color:#334e68;\"><strong>Adresse :</strong> " + order.getAddress() + "</p>"
                + "<p style=\"margin:0;font-size:14px;color:#334e68;\"><strong>Total :</strong> " + order.getTotalAmount() + " DT</p>"
                + "</div>"
                + "<p style=\"margin:0;font-size:14px;color:#334e68;\">Merci de prendre en charge cette livraison rapidement et de rester disponible pour une éventuelle mise à jour du client.</p>"
                + "</div></div></div>";

        String textContent = "Bonjour " + recipientName + ",\n\n"
                + "Vous avez été assigné à la commande #" + order.getId() + ".\n"
                + "Client : " + order.getUser().getFirstName() + " " + order.getUser().getLastName() + "\n"
                + "Adresse : " + order.getAddress() + "\n"
                + "Total : " + order.getTotalAmount() + " DT\n\n"
                + "Merci de prendre en charge cette livraison rapidement.";

        brevoService.sendEmail(driver.getEmail(), recipientName, subject, htmlContent, textContent);
        brevoService.sendSms(driver.getPhone(),
                "Nouvelle commande #" + order.getId() + " assignée. Livraison à " + order.getAddress() + ".");
    }

    private void sendDeliveryCompletedEmail(Order order) {
        if (order == null || order.getUser() == null) {
            log.warn("Impossible d'envoyer le mail de livraison : commande ou utilisateur introuvable");
            return;
        }

        String recipientName  = order.getUser().getFirstName() + " " + order.getUser().getLastName();
        String recipientEmail = order.getUser().getEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Impossible d'envoyer le mail de livraison : email client introuvable pour commande #{}", order.getId());
            return;
        }

        String driverName = order.getDriver() != null
                ? order.getDriver().getFirstName() + " " + order.getDriver().getLastName()
                : "Notre équipe";
        String subject = "Votre commande #" + order.getId() + " a été livrée ✅";

        // Lien direct vers la page d'évaluation — configurable via app.frontend.url
        String reviewUrl = frontendUrl + "/reviews";

        String htmlContent = "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f3f7fb;color:#102a43;padding:24px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(11,31,78,0.10);\">"

                // Header
                + "<div style=\"background:linear-gradient(135deg,#0b1f4e 0%,#1f7a8c 100%);color:#ffffff;padding:28px 24px;text-align:center;\">"
                + "<h1 style=\"margin:0 0 8px;font-size:22px;font-weight:700;\">Livraison effectuée avec succès ✅</h1>"
                + "<p style=\"margin:0;font-size:14px;opacity:0.85;\">Votre commande est désormais entre vos mains.</p>"
                + "</div>"

                // Body
                + "<div style=\"padding:28px 24px;\">"
                + "<p style=\"margin:0 0 16px;font-size:15px;font-weight:600;color:#102a43;\">Bonjour " + recipientName + ",</p>"
                + "<p style=\"margin:0 0 20px;font-size:14px;color:#334e68;line-height:1.7;\">"
                + "Nous vous confirmons que votre commande <strong>#" + order.getId() + "</strong> a bien été livrée. "
                + "Merci pour votre confiance et votre fidélité à <strong>Aurelia Smart Food</strong>.</p>"

                // Détails livraison
                + "<div style=\"background:#f7fbff;border-radius:12px;padding:16px 18px;margin-bottom:20px;border:1px solid #dce9f7;\">"
                + "<p style=\"margin:0 0 8px;font-size:14px;color:#0b3c5d;font-weight:700;\">Détails de votre livraison</p>"
                + "<p style=\"margin:0 0 5px;font-size:13px;color:#334e68;\"><strong>Livreur :</strong> " + driverName + "</p>"
                + "<p style=\"margin:0;font-size:13px;color:#334e68;\"><strong>Adresse :</strong> " + order.getAddress() + "</p>"
                + "</div>"

                // CTA Évaluation avec lien cliquable
                + "<div style=\"background:#fffbeb;border-radius:12px;padding:20px;border:1px solid #fde68a;text-align:center;\">"
                + "<p style=\"margin:0 0 6px;font-size:15px;color:#92400e;font-weight:700;\">⭐ Votre avis compte !</p>"
                + "<p style=\"margin:0 0 16px;font-size:13px;color:#78350f;line-height:1.6;\">"
                + "Prenez 2 minutes pour évaluer votre livreur. Votre retour nous aide à maintenir un service rapide et fiable.</p>"
                + "<a href=\"" + reviewUrl + "\" "
                + "style=\"display:inline-block;background:linear-gradient(135deg,#0b1f4e,#1f7a8c);color:#ffffff;"
                + "text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:700;font-size:14px;"
                + "letter-spacing:0.3px;\">"
                + "⭐ Noter ma livraison"
                + "</a>"
                + "</div>"

                + "</div>"

                // Footer
                + "<div style=\"background:#f0f5ff;padding:14px 24px;text-align:center;border-top:1px solid #dce9f7;\">"
                + "<p style=\"margin:0;font-size:12px;color:#8898aa;\">Aurelia Smart Food — Votre marketplace de livraison rapide</p>"
                + "</div>"

                + "</div></div>";

        String textContent = "Bonjour " + recipientName + ",\n\n"
                + "Votre commande #" + order.getId() + " a été livrée avec succès.\n"
                + "Livreur : " + driverName + "\n"
                + "Adresse : " + order.getAddress() + "\n\n"
                + "Notez votre livraison ici : " + reviewUrl + "\n\n"
                + "Merci pour votre confiance.\n"
                + "L'équipe Aurelia Smart Food";

        log.info("Envoi du mail de livraison à {} pour la commande #{}", recipientEmail, order.getId());
        brevoService.sendEmail(recipientEmail, recipientName, subject, htmlContent, textContent);
    }
}
