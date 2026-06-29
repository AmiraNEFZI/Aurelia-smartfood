package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.CreateOrderRequest;
import com.aurelia.backend.dto.response.OrderResponse;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Commandes", description = "Gestion des commandes")
public class OrderController {

    private final OrderService orderService;

    /**
     * CLIENT : passer une commande depuis son panier.
     */
    @PostMapping("/checkout")
    @Operation(summary = "Passer une commande (checkout)")
    public ResponseEntity<OrderResponse> checkout(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.checkout(userDetails.getUsername(), request));
    }

    /**
     * CLIENT : historique de mes commandes.
     */
    @GetMapping("/my")
    @Operation(summary = "Mes commandes")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getMyOrders(userDetails.getUsername()));
    }

    /**
     * CLIENT / LIVREUR / ADMIN : détail d'une commande.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une commande")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getOrderById(id, userDetails.getUsername()));
    }

    /**
     * ADMIN : toutes les commandes.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toutes les commandes (admin)")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /**
     * ADMIN : mettre à jour le statut d'une commande.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIVREUR')")
    @Operation(summary = "Mettre à jour le statut d'une commande")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam StatutCommande status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }

    /**
     * LIVREUR : mes livraisons assignées.
     */
    @GetMapping("/deliveries")
    @PreAuthorize("hasRole('LIVREUR')")
    @Operation(summary = "Mes livraisons (livreur)")
    public ResponseEntity<List<OrderResponse>> getMyDeliveries(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getMyDeliveries(userDetails.getUsername()));
    }
}
