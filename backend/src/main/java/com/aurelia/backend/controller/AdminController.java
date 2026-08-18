package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.ApproveDriverApplicationRequest;
import com.aurelia.backend.dto.request.CreateAdminRequest;
import com.aurelia.backend.dto.request.CreateDriverRequest;
import com.aurelia.backend.dto.request.RejectDriverApplicationRequest;
import com.aurelia.backend.dto.request.SuspendDriverRequest;
import com.aurelia.backend.dto.response.DriverApplicationResponse;
import com.aurelia.backend.dto.response.DriverComplaintResponse;
import com.aurelia.backend.dto.response.DriverRatingSummaryResponse;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.DriverApplicationStatus;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.repository.DriverReviewRepository;
import com.aurelia.backend.repository.UserRepository;
import com.aurelia.backend.service.DriverApplicationService;
import com.aurelia.backend.service.DriverComplaintService;
import com.aurelia.backend.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Gestion admin — livreurs, admins et utilisateurs")
public class AdminController {

    private final DriverService driverService;
    private final DriverApplicationService driverApplicationService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DriverReviewRepository driverReviewRepository;
    private final DriverComplaintService complaintService;

    // ── Livreurs ──────────────────────────────────────────────────────────────

    @PostMapping("/drivers")
    @Operation(summary = "Créer un compte livreur")
    public ResponseEntity<UserResponse> createDriver(
            @Valid @RequestBody CreateDriverRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(driverService.createDriver(request));
    }

    @GetMapping("/drivers")
    @Operation(summary = "Lister tous les livreurs")
    public ResponseEntity<List<UserResponse>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    @DeleteMapping("/drivers/{id}")
    @Operation(summary = "Supprimer un livreur")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        driverService.deleteDriver(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/driver-applications")
    @Operation(summary = "Lister les candidatures livreurs")
    public ResponseEntity<List<DriverApplicationResponse>> getDriverApplications(
            @RequestParam(required = false) String status) {
        DriverApplicationStatus applicationStatus = null;
        if (status != null) {
            try {
                applicationStatus = DriverApplicationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {
                applicationStatus = null;
            }
        }
        return ResponseEntity.ok(driverApplicationService.getApplications(applicationStatus));
    }

    @PatchMapping("/driver-applications/{id}/approve")
    @Operation(summary = "Approuver une candidature livreur")
    public ResponseEntity<DriverApplicationResponse> approveDriverApplication(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveDriverApplicationRequest request) {
        String password = request != null ? request.getPassword() : null;
        return ResponseEntity.ok(driverApplicationService.approveApplication(id, password));
    }

    @PatchMapping("/driver-applications/{id}/reject")
    @Operation(summary = "Rejeter une candidature livreur")
    public ResponseEntity<DriverApplicationResponse> rejectDriverApplication(
            @PathVariable Long id,
            @Valid @RequestBody RejectDriverApplicationRequest request) {
        return ResponseEntity.ok(driverApplicationService.rejectApplication(id, request.getReason()));
    }

    // ── Admins ────────────────────────────────────────────────────────────────

    @PostMapping("/admins")
    @Operation(summary = "Créer un compte administrateur")
    public ResponseEntity<UserResponse> createAdmin(
            @Valid @RequestBody CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Un compte avec cet email existe déjà.");
        }
        User admin = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ADMIN)
                .build();
        User saved = userRepository.save(admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    // ── Tous les utilisateurs ─────────────────────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "Lister tous les utilisateurs (tous rôles)")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String role) {
        List<User> users;
        if (role != null) {
            try {
                Role r = Role.valueOf(role.toUpperCase());
                users = userRepository.findByRole(r);
            } catch (IllegalArgumentException e) {
                users = userRepository.findAll();
            }
        } else {
            users = userRepository.findAll();
        }
        return ResponseEntity.ok(users.stream().map(this::toResponse).toList());
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Supprimer un utilisateur")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Satisfaction livreurs ─────────────────────────────────────────────────

    /**
     * Vue globale satisfaction : note moyenne + nombre d'évaluations pour chaque livreur.
     * GET /api/admin/drivers/reviews-summary
     */
    @GetMapping("/drivers/reviews-summary")
    @Operation(summary = "Vue globale satisfaction clients par livreur")
    public ResponseEntity<List<DriverRatingSummaryResponse>> getDriversReviewsSummary() {
        // Livreurs ayant au moins une évaluation
        List<Object[]> rows = driverReviewRepository.findDriverReviewsSummary();
        List<DriverRatingSummaryResponse> result = rows.stream().map(row -> {
            Long   driverId    = ((Number) row[0]).longValue();
            String firstName   = (String) row[1];
            String lastName    = (String) row[2];
            double avg         = ((Number) row[3]).doubleValue();
            long   total       = ((Number) row[4]).longValue();
            return DriverRatingSummaryResponse.builder()
                    .driverId(driverId)
                    .driverName(firstName + " " + lastName)
                    .averageRating(Math.round(avg * 10.0) / 10.0)
                    .totalReviews(total)
                    .satisfactionPct((int) Math.round(avg / 5.0 * 100))
                    .recentReviews(List.of())
                    .build();
        }).toList();

        // Livreurs sans aucune évaluation (note = N/A)
        List<User> allDrivers = userRepository.findByRole(Role.LIVREUR);
        java.util.Set<Long> evaluatedIds = result.stream()
                .map(DriverRatingSummaryResponse::getDriverId)
                .collect(java.util.stream.Collectors.toSet());

        List<DriverRatingSummaryResponse> noReview = allDrivers.stream()
                .filter(d -> !evaluatedIds.contains(d.getId()))
                .map(d -> DriverRatingSummaryResponse.builder()
                        .driverId(d.getId())
                        .driverName(d.getFirstName() + " " + d.getLastName())
                        .averageRating(0.0)
                        .totalReviews(0L)
                        .satisfactionPct(0)
                        .recentReviews(List.of())
                        .build())
                .toList();

        List<DriverRatingSummaryResponse> combined = new java.util.ArrayList<>(result);
        combined.addAll(noReview);
        return ResponseEntity.ok(combined);
    }

    // ── Réclamations livreurs ─────────────────────────────────────────────────

    /**
     * GET /api/admin/drivers/{id}/complaints
     * Réclamations d'un livreur spécifique.
     */
    @GetMapping("/drivers/{id}/complaints")
    @Operation(summary = "Réclamations reçues par un livreur")
    public ResponseEntity<List<DriverComplaintResponse>> getDriverComplaints(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getComplaintsForDriver(id));
    }

    /**
     * GET /api/admin/complaints
     * Toutes les réclamations — vue globale.
     */
    @GetMapping("/complaints")
    @Operation(summary = "Toutes les réclamations (admin)")
    public ResponseEntity<List<DriverComplaintResponse>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    // ── Suspension / Réactivation livreur ────────────────────────────────────

    /**
     * PATCH /api/admin/drivers/{id}/suspend
     * Suspend le compte du livreur + envoie un email avec la raison.
     */
    @PatchMapping("/drivers/{id}/suspend")
    @Operation(summary = "Suspendre le compte d'un livreur")
    public ResponseEntity<UserResponse> suspendDriver(
            @PathVariable Long id,
            @Valid @RequestBody SuspendDriverRequest request) {
        return ResponseEntity.ok(complaintService.suspendDriver(id, request));
    }

    /**
     * PATCH /api/admin/drivers/{id}/reactivate
     * Réactive le compte d'un livreur suspendu + envoie un email.
     */
    @PatchMapping("/drivers/{id}/reactivate")
    @Operation(summary = "Réactiver le compte d'un livreur suspendu")
    public ResponseEntity<UserResponse> reactivateDriver(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.reactivateDriver(id));
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .statutLivreur(user.getStatutLivreur())
                .build();
    }
}
