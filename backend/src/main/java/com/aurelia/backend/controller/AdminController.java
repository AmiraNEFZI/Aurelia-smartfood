package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.CreateDriverRequest;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Gestion admin — livreurs et utilisateurs")
public class AdminController {

    private final DriverService driverService;

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
}
