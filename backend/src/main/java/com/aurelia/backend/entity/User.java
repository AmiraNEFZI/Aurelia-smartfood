package com.aurelia.backend.entity;

import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutLivreur;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "phone")
    private String phone;

    @Email
    @NotBlank
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @NotBlank
    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    /**
     * Utilisé uniquement pour les livreurs (role = LIVREUR).
     * null pour CLIENT et ADMIN.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_livreur")
    private StatutLivreur statutLivreur;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;


    // Relation 1-1 avec Cart (créé automatiquement à l'inscription du client)
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Cart cart;
}
