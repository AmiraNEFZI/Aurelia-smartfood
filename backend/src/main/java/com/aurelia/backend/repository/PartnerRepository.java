package com.aurelia.backend.repository;

import com.aurelia.backend.entity.Partner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartnerRepository extends JpaRepository<Partner, Long> {
    List<Partner> findByIsActiveTrue();
    boolean existsByEmail(String email);
}
