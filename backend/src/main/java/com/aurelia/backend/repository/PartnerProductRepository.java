package com.aurelia.backend.repository;

import com.aurelia.backend.entity.PartnerProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PartnerProductRepository extends JpaRepository<PartnerProduct, Long> {

    /**
     * Trouve tous les PartnerProducts disponibles pour un produit donné,
     * triés par prix ASC (le moins cher en premier).
     * Filtre : partenaire actif + stock > 0 + isAvailable = true.
     */
    @Query("""
        SELECT pp FROM PartnerProduct pp
        WHERE pp.product.id = :productId
          AND pp.partner.isActive = true
          AND pp.isAvailable = true
          AND pp.stock > 0
        ORDER BY pp.price ASC
        """)
    List<PartnerProduct> findAvailableByProductId(@Param("productId") Long productId);

    List<PartnerProduct> findByPartnerId(Long partnerId);

    boolean existsByPartnerIdAndProductId(Long partnerId, Long productId);
}
