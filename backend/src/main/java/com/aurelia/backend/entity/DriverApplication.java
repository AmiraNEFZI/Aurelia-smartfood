package com.aurelia.backend.entity;

import com.aurelia.backend.enums.DriverApplicationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "driver_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "document_url", nullable = false)
    private String documentUrl;

    @Builder.Default
    @Column(name = "password_hash", nullable = false)
    private String passwordHash = "";

    @Column(name = "reject_reason")
    private String rejectReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DriverApplicationStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
