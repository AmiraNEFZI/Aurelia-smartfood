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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

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

        // Calculer le total et vérifier les stocks
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (product.getStock() < item.getQuantity()) {
                throw new BusinessException(
                        "Stock insuffisant pour : " + product.getName()
                        + " (disponible : " + product.getStock() + ")");
            }
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
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

        // Créer les OrderItems (snapshot)
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(item.getQuantity())
                    .unitPrice(product.getPrice())
                    .productName(product.getName())
                    .build();
            order.getItems().add(orderItem);

            // Décrémenter le stock
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
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
     * Assigne aléatoirement un seul livreur DISPONIBLE à la commande.
     * Utilise le verrouillage optimiste (@Version) pour éviter les conflits.
     */
    @Transactional
    public void assignerLivreur(Order order) {
        List<User> livreursDisponibles =
                userRepository.findLivreursParStatut(StatutLivreur.DISPONIBLE);

        if (livreursDisponibles.isEmpty()) {
            // Pas de livreur disponible — la commande reste EN_ATTENTE
            return;
        }

        // Sélection aléatoire d'un seul livreur
        User livreur = livreursDisponibles.get(new Random().nextInt(livreursDisponibles.size()));

        order.setDriver(livreur);
        order.setStatus(StatutCommande.PRISE_EN_CHARGE);

        // Marquer le livreur comme OCCUPE
        livreur.setStatutLivreur(StatutLivreur.OCCUPE);
        userRepository.save(livreur);

        orderRepository.save(order);
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
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
    }
}
