package com.aurelia.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Partenaire fournisseur — possède son propre stock de produits.
 * Utilisé pour le sourcing automatique quand Aurelia est en rupture.
 */
@Entity
@Table(name = "partners")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Partner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "name", nullable = false)
    private String name;

    @Email
    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "website")
    private String website;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // 1 partenaire → N produits partenaire
    @OneToMany(mappedBy = "partner", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PartnerProduct> products = new ArrayList<>();
}
