package com.aurelia.backend.repository;

import com.aurelia.backend.entity.DriverReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverReviewRepository extends JpaRepository<DriverReview, Long> {

    boolean existsByOrderId(Long orderId);

    long countByDriverId(Long driverId);

    /** Toutes les évaluations d'un livreur, triées par date DESC. */
    List<DriverReview> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    /** Note moyenne d'un livreur (null si aucune évaluation). */
    @Query("SELECT AVG(r.rating) FROM DriverReview r WHERE r.driver.id = :driverId")
    Optional<Double> findAverageRatingByDriverId(@Param("driverId") Long driverId);

    /**
     * Résumé de satisfaction pour tous les livreurs.
     * Retourne [driverId, firstName, lastName, avgRating, totalReviews].
     */
    @Query("""
        SELECT r.driver.id,
               r.driver.firstName,
               r.driver.lastName,
               AVG(r.rating),
               COUNT(r.id)
        FROM DriverReview r
        GROUP BY r.driver.id, r.driver.firstName, r.driver.lastName
        ORDER BY AVG(r.rating) DESC
        """)
    List<Object[]> findDriverReviewsSummary();
}
