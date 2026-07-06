package com.aurelia.backend.controller;

import com.aurelia.backend.dto.request.PartnerProductRequest;
import com.aurelia.backend.dto.request.PartnerRequest;
import com.aurelia.backend.dto.response.PartnerProductResponse;
import com.aurelia.backend.dto.response.PartnerResponse;
import com.aurelia.backend.service.PartnerService;
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
@RequestMapping("/api/partners")
@RequiredArgsConstructor
@Tag(name = "Partenaires", description = "Gestion des partenaires fournisseurs")
public class PartnerController {

    private final PartnerService partnerService;

    // ── Partenaires (ADMIN) ───────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lister tous les partenaires")
    public ResponseEntity<List<PartnerResponse>> getAll() {
        return ResponseEntity.ok(partnerService.getAllPartners());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Détail d'un partenaire")
    public ResponseEntity<PartnerResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(partnerService.getPartnerById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un partenaire")
    public ResponseEntity<PartnerResponse> create(@Valid @RequestBody PartnerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(partnerService.createPartner(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un partenaire")
    public ResponseEntity<PartnerResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody PartnerRequest req) {
        return ResponseEntity.ok(partnerService.updatePartner(id, req));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer / désactiver un partenaire")
    public ResponseEntity<PartnerResponse> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(partnerService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un partenaire")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        partnerService.deletePartner(id);
        return ResponseEntity.noContent().build();
    }

    // ── Produits du partenaire (ADMIN) ───────────────────────────────────────

    @GetMapping("/{partnerId}/products")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Produits d'un partenaire")
    public ResponseEntity<List<PartnerProductResponse>> getProducts(@PathVariable Long partnerId) {
        return ResponseEntity.ok(partnerService.getPartnerProducts(partnerId));
    }

    @PostMapping("/{partnerId}/products")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Ajouter un produit au partenaire")
    public ResponseEntity<PartnerProductResponse> addProduct(
            @PathVariable Long partnerId,
            @Valid @RequestBody PartnerProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(partnerService.addProductToPartner(partnerId, req));
    }

    @PutMapping("/products/{partnerProductId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un produit partenaire (stock, prix)")
    public ResponseEntity<PartnerProductResponse> updateProduct(
            @PathVariable Long partnerProductId,
            @Valid @RequestBody PartnerProductRequest req) {
        return ResponseEntity.ok(partnerService.updatePartnerProduct(partnerProductId, req));
    }

    @DeleteMapping("/products/{partnerProductId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Retirer un produit du partenaire")
    public ResponseEntity<Void> removeProduct(@PathVariable Long partnerProductId) {
        partnerService.removeProductFromPartner(partnerProductId);
        return ResponseEntity.noContent().build();
    }

    // ── Disponibilité publique (CLIENT) ───────────────────────────────────────

    @GetMapping("/availability/{productId}")
    @Operation(summary = "Vérifier disponibilité d'un produit via partenaires (public)")
    public ResponseEntity<Boolean> checkAvailability(@PathVariable Long productId) {
        return ResponseEntity.ok(partnerService.isProductAvailableAnywhere(productId));
    }

    @GetMapping("/availability/{productId}/stock")
    @Operation(summary = "Stock max disponible chez le meilleur partenaire (public)")
    public ResponseEntity<Integer> getPartnerStock(@PathVariable Long productId) {
        return ResponseEntity.ok(partnerService.getBestPartnerStock(productId));
    }
}
