package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.CreateAdminRequest;
import com.aurelia.backend.dto.request.CreateDriverRequest;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.repository.UserRepository;
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

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Gestion admin — livreurs, admins et utilisateurs")
public class AdminController {

    private final DriverService driverService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
