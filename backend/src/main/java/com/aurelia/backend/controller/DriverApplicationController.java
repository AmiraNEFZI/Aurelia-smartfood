package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.CreateDriverApplicationRequest;
import com.aurelia.backend.dto.response.DriverApplicationResponse;
import com.aurelia.backend.service.DriverApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/driver-applications")
@RequiredArgsConstructor
@Tag(name = "Driver Applications", description = "Soumission et consultation des candidatures livreurs")
public class DriverApplicationController {

    private final DriverApplicationService driverApplicationService;

    @PostMapping
    @Operation(summary = "Soumettre une candidature livreur")
    public ResponseEntity<DriverApplicationResponse> submitApplication(
            @Valid @RequestBody CreateDriverApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(driverApplicationService.createApplication(request));
    }
}
