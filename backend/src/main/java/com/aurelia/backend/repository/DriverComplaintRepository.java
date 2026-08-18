package com.aurelia.backend.repository;

import com.aurelia.backend.entity.DriverComplaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverComplaintRepository extends JpaRepository<DriverComplaint, Long> {

    boolean existsByOrderId(Long orderId);

    /** Réclamations reçues par un livreur, les plus récentes en premier. */
    List<DriverComplaint> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    /** Nombre de réclamations d'un livreur. */
    long countByDriverId(Long driverId);

    /**
     * Résumé réclamations pour tous les livreurs.
     * Retourne [driverId, firstName, lastName, totalComplaints].
     */
    @Query("""
        SELECT c.driver.id, c.driver.firstName, c.driver.lastName, COUNT(c.id)
        FROM DriverComplaint c
        GROUP BY c.driver.id, c.driver.firstName, c.driver.lastName
        """)
    List<Object[]> findComplaintCountByDriver();
}
