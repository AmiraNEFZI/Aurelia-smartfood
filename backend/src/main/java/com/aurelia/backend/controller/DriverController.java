package com.aurelia.backend.controller;

import com.aurelia.backend.dto.response.DriverComplaintResponse;
import com.aurelia.backend.dto.response.DriverRatingSummaryResponse;
import com.aurelia.backend.dto.response.DriverReviewResponse;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.repository.DriverReviewRepository;
import com.aurelia.backend.repository.UserRepository;
import com.aurelia.backend.service.DriverComplaintService;
import com.aurelia.backend.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
@Tag(name = "Livreur", description = "Espace livreur")
public class DriverController {

    private final DriverService          driverService;
    private final DriverReviewRepository driverReviewRepository;
    private final UserRepository         userRepository;
    private final DriverComplaintService complaintService;

    /**
     * LIVREUR : mettre à jour son propre statut de disponibilité.
     */
    @PatchMapping("/status")
    @PreAuthorize("hasRole('LIVREUR')")
    @Operation(summary = "Mettre à jour mon statut de disponibilité")
    public ResponseEntity<UserResponse> updateMyStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam StatutLivreur status) {
        return ResponseEntity.ok(
                driverService.updateStatus(userDetails.getUsername(), status));
    }

    /**
     * LIVREUR : consulter ses propres évaluations + note moyenne.
     * GET /api/driver/my-reviews
     */
    @GetMapping("/my-reviews")
    @PreAuthorize("hasRole('LIVREUR')")
    @Operation(summary = "Mes évaluations clients")
    public ResponseEntity<DriverRatingSummaryResponse> getMyReviews(
            @AuthenticationPrincipal UserDetails userDetails) {

        var driver = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        List<com.aurelia.backend.entity.DriverReview> reviews =
                driverReviewRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId());

        double avg = reviews.stream()
                .mapToInt(com.aurelia.backend.entity.DriverReview::getRating)
                .average()
                .orElse(0.0);

        // Les 5 derniers commentaires non vides
        List<DriverReviewResponse> recent = reviews.stream()
                .filter(r -> r.getComment() != null && !r.getComment().isBlank())
                .limit(5)
                .map(r -> DriverReviewResponse.builder()
                        .id(r.getId())
                        .orderId(r.getOrder().getId())
                        .driverId(driver.getId())
                        .driverName(driver.getFirstName() + " " + driver.getLastName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();

        DriverRatingSummaryResponse summary = DriverRatingSummaryResponse.builder()
                .driverId(driver.getId())
                .driverName(driver.getFirstName() + " " + driver.getLastName())
                .averageRating(Math.round(avg * 10.0) / 10.0)
                .totalReviews((long) reviews.size())
                .satisfactionPct(reviews.isEmpty() ? 0 : (int) Math.round(avg / 5.0 * 100))
                .recentReviews(recent)
                .build();

        return ResponseEntity.ok(summary);
    }

    /**
     * LIVREUR : consulter ses réclamations reçues.
     * GET /api/driver/my-complaints
     */
    @GetMapping("/my-complaints")
    @PreAuthorize("hasRole('LIVREUR')")
    @Operation(summary = "Mes réclamations reçues")
    public ResponseEntity<List<DriverComplaintResponse>> getMyComplaints(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(complaintService.getMyComplaints(userDetails.getUsername()));
    }
}
