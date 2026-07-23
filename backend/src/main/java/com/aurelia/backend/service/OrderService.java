package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.CreateOrderRequest;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final AssignationService assignationService;   // ← Amél. 2

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

        log.info("Admin: livreur {} assigné manuellement à commande #{}", driver.getEmail(), orderId);
        return toResponse(orderRepository.save(order));
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
}
