package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.PartnerProductRequest;
import com.aurelia.backend.dto.request.PartnerRequest;
import com.aurelia.backend.dto.response.PartnerProductResponse;
import com.aurelia.backend.dto.response.PartnerResponse;
import com.aurelia.backend.entity.Partner;
import com.aurelia.backend.entity.PartnerProduct;
import com.aurelia.backend.entity.Product;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.PartnerProductRepository;
import com.aurelia.backend.repository.PartnerRepository;
import com.aurelia.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartnerService {

    private final PartnerRepository partnerRepository;
    private final PartnerProductRepository partnerProductRepository;
    private final ProductRepository productRepository;

    // ── CRUD Partenaires ──────────────────────────────────────────────────────

    public List<PartnerResponse> getAllPartners() {
        return partnerRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PartnerResponse getPartnerById(Long id) {
        return toResponse(findPartner(id));
    }

    @Transactional
    public PartnerResponse createPartner(PartnerRequest req) {
        Partner partner = Partner.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .address(req.getAddress())
                .contactPerson(req.getContactPerson())
                .website(req.getWebsite())
                .description(req.getDescription())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();
        return toResponse(partnerRepository.save(partner));
    }

    @Transactional
    public PartnerResponse updatePartner(Long id, PartnerRequest req) {
        Partner partner = findPartner(id);
        partner.setName(req.getName());
        partner.setEmail(req.getEmail());
        partner.setPhone(req.getPhone());
        partner.setAddress(req.getAddress());
        partner.setContactPerson(req.getContactPerson());
        partner.setWebsite(req.getWebsite());
        partner.setDescription(req.getDescription());
        if (req.getIsActive() != null) partner.setIsActive(req.getIsActive());
        return toResponse(partnerRepository.save(partner));
    }

    @Transactional
    public void deletePartner(Long id) {
        Partner p = findPartner(id);
        partnerRepository.delete(p);
    }

    @Transactional
    public PartnerResponse toggleActive(Long id) {
        Partner partner = findPartner(id);
        partner.setIsActive(!partner.getIsActive());
        return toResponse(partnerRepository.save(partner));
    }

    // ── CRUD Produits Partenaire ──────────────────────────────────────────────

    public List<PartnerProductResponse> getPartnerProducts(Long partnerId) {
        return partnerProductRepository.findByPartnerId(partnerId).stream()
                .map(this::toProductResponse)
                .toList();
    }

    @Transactional
    public PartnerProductResponse addProductToPartner(Long partnerId, PartnerProductRequest req) {
        Partner partner = findPartner(partnerId);
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + req.getProductId()));

        if (partnerProductRepository.existsByPartnerIdAndProductId(partnerId, req.getProductId())) {
            throw new BusinessException("Ce partenaire possède déjà ce produit. Modifiez-le directement.");
        }

        PartnerProduct pp = PartnerProduct.builder()
                .partner(partner)
                .product(product)
                .stock(req.getStock())
                .price(req.getPrice())
                .isAvailable(req.getIsAvailable() != null ? req.getIsAvailable() : true)
                .build();

        return toProductResponse(partnerProductRepository.save(pp));
    }

    @Transactional
    public PartnerProductResponse updatePartnerProduct(Long partnerProductId, PartnerProductRequest req) {
        PartnerProduct pp = partnerProductRepository.findById(partnerProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit partenaire introuvable."));
        pp.setStock(req.getStock());
        pp.setPrice(req.getPrice());
        if (req.getIsAvailable() != null) pp.setIsAvailable(req.getIsAvailable());
        return toProductResponse(partnerProductRepository.save(pp));
    }

    @Transactional
    public void removeProductFromPartner(Long partnerProductId) {
        partnerProductRepository.deleteById(partnerProductId);
    }

    // ── Logique de sourcing automatique ──────────────────────────────────────

    /**
     * Sélectionne le meilleur partenaire pour sourcer un produit en rupture.
     *
     * Algorithme :
     * 1. Récupère tous les PartnerProducts disponibles triés par prix ASC
     * 2. Si plusieurs ont le même prix minimum → choisit aléatoirement parmi eux
     * 3. Décrémente le stock du partenaire choisi
     * 4. Retourne le PartnerProduct sélectionné (ou empty si aucun)
     */
    @Transactional
    public Optional<PartnerProduct> sourcerProduit(Long productId, int quantiteNecessaire) {
        List<PartnerProduct> candidats = partnerProductRepository.findAvailableByProductId(productId)
                .stream()
                .filter(pp -> pp.getStock() >= quantiteNecessaire)
                .toList();

        if (candidats.isEmpty()) {
            log.warn("⚠️ Aucun partenaire ne peut fournir le produit #{} (qté: {})", productId, quantiteNecessaire);
            return Optional.empty();
        }

        // Prix minimum parmi les candidats
        BigDecimal prixMin = candidats.get(0).getPrice(); // déjà trié ASC

        // Filtrer ceux qui ont le même prix minimum
        List<PartnerProduct> meilleurPrix = candidats.stream()
                .filter(pp -> pp.getPrice().compareTo(prixMin) == 0)
                .toList();

        // Si égalité de prix → choix aléatoire
        PartnerProduct choisi;
        if (meilleurPrix.size() == 1) {
            choisi = meilleurPrix.get(0);
        } else {
            List<PartnerProduct> modifiable = new java.util.ArrayList<>(meilleurPrix);
            Collections.shuffle(modifiable);
            choisi = modifiable.get(0);
        }

        // Décrémenter le stock du partenaire
        choisi.setStock(choisi.getStock() - quantiteNecessaire);
        if (choisi.getStock() == 0) choisi.setIsAvailable(false);
        partnerProductRepository.save(choisi);

        log.info("✅ Sourcing automatique : produit #{} fourni par partenaire '{}' (prix: {} DT, stock restant: {})",
                productId, choisi.getPartner().getName(), choisi.getPrice(), choisi.getStock());

        return Optional.of(choisi);
    }

    /**
     * Vérifie si un produit est disponible (stock Aurelia + partenaires).
     * Utilisé par le frontend client pour afficher la disponibilité.
     */
    public boolean isProductAvailableAnywhere(Long productId) {
        return !partnerProductRepository.findAvailableByProductId(productId).isEmpty();
    }

    /**
     * Retourne le stock du meilleur partenaire pour ce produit
     * (même algorithme que sourcerProduit : prix le plus bas → aléatoire si égalité).
     * Retourne 0 si aucun partenaire disponible.
     */
    public int getBestPartnerStock(Long productId) {
        List<PartnerProduct> candidats = partnerProductRepository.findAvailableByProductId(productId)
                .stream()
                .filter(pp -> pp.getStock() > 0)
                .toList();

        if (candidats.isEmpty()) return 0;

        BigDecimal prixMin = candidats.get(0).getPrice(); // déjà trié ASC

        List<PartnerProduct> meilleurPrix = candidats.stream()
                .filter(pp -> pp.getPrice().compareTo(prixMin) == 0)
                .toList();

        PartnerProduct choisi;
        if (meilleurPrix.size() == 1) {
            choisi = meilleurPrix.get(0);
        } else {
            List<PartnerProduct> modifiable = new java.util.ArrayList<>(meilleurPrix);
            Collections.shuffle(modifiable);
            choisi = modifiable.get(0);
        }
        return choisi.getStock();
    }

    // ── Statistiques ─────────────────────────────────────────────────────────

    public long countActivePartners() {
        return partnerRepository.findByIsActiveTrue().size();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private Partner findPartner(Long id) {
        return partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partenaire introuvable : " + id));
    }

    public PartnerResponse toResponse(Partner p) {
        List<PartnerProductResponse> products = p.getProducts().stream()
                .map(this::toProductResponse)
                .toList();

        int totalStock = p.getProducts().stream()
                .mapToInt(pp -> pp.getStock() != null ? pp.getStock() : 0)
                .sum();

        return PartnerResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .address(p.getAddress())
                .contactPerson(p.getContactPerson())
                .website(p.getWebsite())
                .description(p.getDescription())
                .isActive(p.getIsActive())
                .products(products)
                .totalProducts(products.size())
                .totalStock(totalStock)
                .build();
    }

    public PartnerProductResponse toProductResponse(PartnerProduct pp) {
        return PartnerProductResponse.builder()
                .id(pp.getId())
                .partnerId(pp.getPartner().getId())
                .partnerName(pp.getPartner().getName())
                .productId(pp.getProduct().getId())
                .productName(pp.getProduct().getName())
                .productImage(pp.getProduct().getImage())
                .stock(pp.getStock())
                .price(pp.getPrice())
                .isAvailable(pp.getIsAvailable())
                .build();
    }
}
