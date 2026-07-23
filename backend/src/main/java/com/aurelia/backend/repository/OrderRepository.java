package com.aurelia.backend.repository;

import com.aurelia.backend.entity.Order;
import com.aurelia.backend.enums.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);

    List<Order> findByDriverIdOrderByOrderDateDesc(Long driverId);

    /**
     * Commandes EN_ATTENTE sans livreur, créées avant :cutoff.
     * Pour le scheduler de rattrapage (toutes les 60s).
     */
    @Query("""
        SELECT o FROM Order o
        WHERE o.status = 'EN_ATTENTE'
          AND o.driver IS NULL
          AND o.orderDate < :cutoff
        ORDER BY o.orderDate ASC
        """)
    List<Order> findCommandesSansLivreurAvant(@Param("cutoff") LocalDateTime cutoff);

    /**
     * Commandes actives d'un livreur créées avant :cutoff.
     * Pour le scheduler de libération des livreurs bloqués (toutes les 15min).
     */
    @Query("""
        SELECT o FROM Order o
        WHERE o.driver.id = :driverId
          AND o.status IN ('PRISE_EN_CHARGE', 'EN_LIVRAISON')
          AND o.orderDate < :cutoff
        """)
    List<Order> findCommandesActivesAvant(@Param("driverId") Long driverId,
                                          @Param("cutoff") LocalDateTime cutoff);

    /**
     * Nombre de livraisons LIVREE d'un livreur depuis :depuis.
     * Utilisé pour afficher les stats du livreur.
     */
    @Query("""
        SELECT COUNT(o) FROM Order o
        WHERE o.driver.id = :driverId
          AND o.status = 'LIVREE'
          AND o.orderDate >= :depuis
        """)
    long countLivraisonsDepuis(@Param("driverId") Long driverId,
                               @Param("depuis") LocalDateTime depuis);

    List<Order> findByStatus(StatutCommande status);

    List<Order> findByStatusOrderByOrderDateAsc(StatutCommande status);
}
