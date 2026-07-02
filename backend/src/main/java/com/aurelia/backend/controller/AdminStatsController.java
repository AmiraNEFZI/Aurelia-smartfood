package com.aurelia.backend.controller;

import com.aurelia.backend.dto.response.AdminStatsResponse;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.service.AdminStatsService;
import com.aurelia.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Stats", description = "Statistiques et données du dashboard admin")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping
    @Operation(summary = "Récupérer toutes les statistiques admin")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminStatsService.getStats());
    }
}
