package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.AddCartItemRequest;
import com.aurelia.backend.dto.response.CartResponse;
import com.aurelia.backend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Panier", description = "Gestion du panier client")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Récupérer mon panier")
    public ResponseEntity<CartResponse> getMyCart(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(cartService.getCart(userDetails.getUsername()));
    }

    @PostMapping("/items")
    @Operation(summary = "Ajouter un produit au panier")
    public ResponseEntity<CartResponse> addItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddCartItemRequest request) {
        return ResponseEntity.ok(cartService.addItem(userDetails.getUsername(), request));
    }

    @PatchMapping("/items/{itemId}")
    @Operation(summary = "Modifier la quantité d'un article")
    public ResponseEntity<CartResponse> updateItemQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long itemId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(
                cartService.updateItemQuantity(userDetails.getUsername(), itemId, quantity));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Supprimer un article du panier")
    public ResponseEntity<CartResponse> removeItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItem(userDetails.getUsername(), itemId));
    }
}
