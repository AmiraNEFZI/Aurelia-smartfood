package com.aurelia.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Stock d'un produit chez un partenaire.
 * Référence le même Product Aurelia pour que la recherche soit cohérente.
 */
@Entity
@Table(name = "partner_products",
       uniqueConstraints = @UniqueConstraint(columnNames = {"partner_id", "product_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PartnerProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Stock disponible chez ce partenaire */
    @Column(name = "stock", nullable = false)
    private Integer stock;

    /**
     * Prix pratiqué par le partenaire.
     * Le client paye le prix Aurelia — l'écart est géré en interne.
     */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;
}
