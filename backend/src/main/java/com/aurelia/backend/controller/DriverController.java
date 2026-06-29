package com.aurelia.backend.controller;

import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
@Tag(name = "Livreur", description = "Espace livreur")
public class DriverController {

    private final DriverService driverService;

    /**
     * LIVREUR : mettre à jour son propre statut de disponibilité.
     * Ex: se connecter (EN_LIGNE → DISPONIBLE), se déconnecter (HORS_LIGNE).
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
}
