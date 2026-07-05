package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.CreateOrderRequest;
import com.aurelia.backend.dto.response.OrderItemResponse;
import com.aurelia.backend.dto.response.OrderResponse;
import com.aurelia.backend.entity.*;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.enums.StatutPaiement;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PartnerService partnerService;

    /**
     * Workflow checkout :
     * 1. Récupérer le panier du client
     * 2. Créer la commande
     * 3. Copier les CartItems → OrderItems (snapshot prix + nom)
     * 4. Décrémenter le stock des produits
     * 5. Vider le panier
     * 6. Assigner automatiquement un livreur disponible
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

        // Calculer le total et vérifier les stocks (Aurelia + partenaires)
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            // Sécurité : produit supprimé entre temps
            if (product == null) {
                throw new BusinessException("Un produit de votre panier n'est plus disponible. Veuillez vider votre panier et recommencer.");
            }
            int qte = item.getQuantity();

            // Vérifier disponibilité : stock Aurelia OU partenaire
            boolean aStockAurelia = product.getStock() >= qte;
            boolean aStockPartenaire = partnerService.isProductAvailableAnywhere(product.getId());

            if (!aStockAurelia && !aStockPartenaire) {
                throw new BusinessException(
                        "Produit indisponible : " + product.getName()
                        + " — ni en stock Aurelia ni chez nos partenaires.");
            }
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(qte)));
        }

        // Créer la commande
        Order order = Order.builder()
                .user(client)
                .address(request.getAddress())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(StatutPaiement.EN_ATTENTE)
                .status(StatutCommande.EN_ATTENTE)
                .totalAmount(total)
                .build();

        // Créer les OrderItems avec sourcing intelligent
        for (CartItem item : cart.getItems()) {
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
                // ✅ Stock Aurelia suffisant
                product.setStock(product.getStock() - qte);
                productRepository.save(product);
                log.info("Stock Aurelia utilisé pour '{}' (restant: {})", product.getName(), product.getStock());
            } else {
                // 🔄 Sourcing automatique via partenaire
                Optional<PartnerProduct> partenaire = partnerService.sourcerProduit(product.getId(), qte);
                if (partenaire.isPresent()) {
                    orderItem.setSourceType("PARTENAIRE");
                    orderItem.setSourcePartner(partenaire.get().getPartner());
                    log.info("🔄 Sourcing partenaire '{}' pour '{}'",
                            partenaire.get().getPartner().getName(), product.getName());
                } else {
                    // Ne devrait pas arriver (vérifié avant), mais sécurité
                    throw new BusinessException("Produit indisponible : " + product.getName());
                }
            }

            order.getItems().add(orderItem);
        }

        orderRepository.save(order);

        // Vider le panier
        cart.getItems().clear();
        cartRepository.save(cart);

        // Assigner un livreur disponible (si disponible)
        assignerLivreur(order);

        return toResponse(order);
    }

    /**
     * Assigne le premier livreur DISPONIBLE en FIFO
     * (celui qui est disponible depuis le plus longtemps).
     * Utilise @Version (optimistic locking) pour éviter les doublons.
     */
    @Transactional
    public void assignerLivreur(Order order) {
        List<User> livreursDisponibles =
                userRepository.findLivreursParStatut(StatutLivreur.DISPONIBLE);

        if (livreursDisponibles.isEmpty()) {
            log.info("Aucun livreur disponible pour la commande #{}", order.getId());
            return;
        }

        // FIFO : prendre le premier de la liste (le plus ancien disponible)
        User livreur = livreursDisponibles.get(0);

        order.setDriver(livreur);
        order.setStatus(StatutCommande.PRISE_EN_CHARGE);

        livreur.setStatutLivreur(StatutLivreur.OCCUPE);
        userRepository.save(livreur);
        orderRepository.save(order);

        log.info("Livreur {} assigné à la commande #{}", livreur.getEmail(), order.getId());
    }

    /**
     * Scheduler : toutes les 2 minutes, vérifie les commandes EN_ATTENTE
     * depuis plus de 10 minutes sans livreur → réessaie l'assignation FIFO.
     */
    @Scheduled(fixedDelay = 120_000) // every 2 minutes
    @Transactional
    public void reessayerAssignation() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(10);

        List<Order> commandesEnAttente = orderRepository.findByStatus(StatutCommande.EN_ATTENTE);

        for (Order order : commandesEnAttente) {
            if (order.getOrderDate().isBefore(cutoff) && order.getDriver() == null) {
                log.info("Timeout 10min: réessai assignation pour commande #{}", order.getId());
                assignerLivreur(order);
            }
        }
    }

    /**
     * Historique des commandes d'un client.
     */
    public List<OrderResponse> getMyOrders(String email) {
        User client = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        return orderRepository.findByUserIdOrderByOrderDateDesc(client.getId())
                .stream().map(this::toResponse).toList();
    }

    /**
     * Détail d'une commande.
     */
    public OrderResponse getOrderById(Long id, String email) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + id));
        User user = userRepository.findByEmail(email).orElseThrow();

        // Un client ne peut voir que ses propres commandes
        boolean isAdmin = user.getRole().name().equals("ADMIN");
        boolean isOwner = order.getUser().getId().equals(user.getId());
        boolean isDriver = order.getDriver() != null && order.getDriver().getId().equals(user.getId());

        if (!isAdmin && !isOwner && !isDriver) {
            throw new BusinessException("Accès non autorisé à cette commande.");
        }

        return toResponse(order);
    }

    /**
     * Toutes les commandes — ADMIN uniquement.
     */
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    /**
     * Commandes assignées au livreur connecté.
     */
    public List<OrderResponse> getMyDeliveries(String email) {
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable."));
        return orderRepository.findByDriverIdOrderByOrderDateDesc(driver.getId())
                .stream().map(this::toResponse).toList();
    }

    /**
     * ADMIN : assigner manuellement un livreur à une commande.
     */
    @Transactional
    public OrderResponse assignDriver(Long orderId, Long driverId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + orderId));
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + driverId));

        // Libérer l'ancien livreur si existant
        if (order.getDriver() != null) {
            User oldDriver = order.getDriver();
            oldDriver.setStatutLivreur(StatutLivreur.DISPONIBLE);
            userRepository.save(oldDriver);
        }

        order.setDriver(driver);
        order.setStatus(StatutCommande.PRISE_EN_CHARGE);
        driver.setStatutLivreur(StatutLivreur.OCCUPE);
        userRepository.save(driver);

        log.info("Admin: livreur {} assigné manuellement à la commande #{}", driver.getEmail(), orderId);
        return toResponse(orderRepository.save(order));
    }

    /**
     * Mettre à jour le statut d'une commande.
     */
    @Transactional
    public OrderResponse updateStatus(Long orderId, StatutCommande newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + orderId));

        order.setStatus(newStatus);

        // Si la commande est livrée → libérer le livreur
        if (newStatus == StatutCommande.LIVREE) {
            if (order.getDriver() != null) {
                User driver = order.getDriver();
                driver.setStatutLivreur(StatutLivreur.DISPONIBLE);
                userRepository.save(driver);
            }
            // Marquer comme payé si paiement cash
            order.setPaymentStatus(StatutPaiement.PAYE);
        }

        // Si la commande est annulée → remettre les stocks + libérer livreur
        if (newStatus == StatutCommande.ANNULEE) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStock(product.getStock() + item.getQuantity());
                productRepository.save(product);
            }
            if (order.getDriver() != null) {
                User driver = order.getDriver();
                driver.setStatutLivreur(StatutLivreur.DISPONIBLE);
                userRepository.save(driver);
            }
        }

        return toResponse(orderRepository.save(order));
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

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
