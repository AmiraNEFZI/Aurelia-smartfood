package com.aurelia.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // N OrderItems → 1 Order
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // N OrderItems → 1 Product (référence nullable : si produit supprimé, on garde le snapshot)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    @Min(1)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Snapshot du prix au moment de la commande
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    // Snapshot du nom au moment de la commande
    @Column(name = "product_name", nullable = false)
    private String productName;

    /**
     * Source de l'article : AURELIA (stock interne) ou PARTENAIRE (sourcing automatique).
     * Défaut = AURELIA — rétrocompatible avec toutes les commandes existantes.
     */
    @Column(name = "source_type", nullable = false, length = 20)
    @Builder.Default
    private String sourceType = "AURELIA";

    /**
     * ID du partenaire si sourceType = PARTENAIRE, sinon null.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_partner_id", nullable = true)
    private Partner sourcePartner;
}
