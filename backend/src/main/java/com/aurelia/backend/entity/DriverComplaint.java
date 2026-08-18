package com.aurelia.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Réclamation d'un client concernant un livreur après une livraison.
 * Une commande peut avoir au plus une réclamation (contrainte unique).
 * Affecte le taux de satisfaction du livreur (chaque réclamation = note 1/5 implicite).
 */
@Entity
@Table(name = "driver_complaints", uniqueConstraints = {
    @UniqueConstraint(name = "uk_complaint_order", columnNames = "order_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DriverComplaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    /** Catégorie de la réclamation. */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ComplaintCategory category;

    /** Description détaillée rédigée par le client. */
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Statut de traitement de la réclamation. */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.OUVERTE;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Enums internes ─────────────────────────────────────────────────────

    public enum ComplaintCategory {
        RETARD_LIVRAISON,
        COMPORTEMENT_INAPPROPRIE,
        COLIS_ENDOMMAGE,
        LIVRAISON_INCORRECTE,
        AUTRE
    }

    public enum ComplaintStatus {
        OUVERTE,
        EN_COURS,
        RESOLUE
    }
}
