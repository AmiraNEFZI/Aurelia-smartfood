package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.CreateUserRequest;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.service.UserService;
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
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Utilisateurs", description = "Gestion des comptes admin, livreurs et clients")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Lister tous les utilisateurs")
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestParam(required = false) Role role) {
        if (role != null) {
            return ResponseEntity.ok(userService.getUsersByRole(role));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @Operation(summary = "Créer un utilisateur")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUser(request));
    }
}
