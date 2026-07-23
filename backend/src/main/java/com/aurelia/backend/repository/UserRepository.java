package com.aurelia.backend.repository;

import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutLivreur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    /**
     * FIFO pur : le livreur DISPONIBLE depuis le plus longtemps reçoit la prochaine commande.
     *
     * L'équité est naturelle : après chaque livraison, le livreur libéré reçoit
     * disponibleDepuis = now() → il passe automatiquement derrière ceux qui attendaient.
     * Pas besoin de compteur — le timestamp fait tout le travail.
     *
     * NULLS LAST : les anciens comptes sans timestamp passent en dernier (safe).
     * id ASC : tie-breaker déterministe si deux timestamps sont identiques (rare).
     */
    @Query("""
        SELECT u FROM User u
        WHERE u.role = 'LIVREUR'
          AND u.statutLivreur = :statut
          AND u.active = true
        ORDER BY u.disponibleDepuis ASC NULLS LAST, u.id ASC
        """)
    List<User> findLivreursDisponiblesFIFO(@Param("statut") StatutLivreur statut);

    /**
     * Livreurs OCCUPE qui ont une commande active (PRISE_EN_CHARGE ou EN_LIVRAISON)
     * dont la date est antérieure à :cutoff — indique qu'ils sont bloqués.
     * Utilisé par le scheduler de libération des livreurs bloqués (timeout 3h).
     *
     * Utilise EXISTS pour éviter les doublons sans JOIN.
     * On se base sur la date de commande car disponibleDepuis est null quand OCCUPE.
     */
    @Query("""
        SELECT u FROM User u
        WHERE u.role = 'LIVREUR'
          AND u.statutLivreur = 'OCCUPE'
          AND EXISTS (
            SELECT 1 FROM Order o
            WHERE o.driver.id = u.id
              AND o.status IN ('PRISE_EN_CHARGE', 'EN_LIVRAISON')
              AND o.orderDate < :cutoff
          )
        """)
    List<User> findLivreursOccupesDepuisAvant(@Param("cutoff") LocalDateTime cutoff);

    // Ancienne méthode conservée pour compatibilité — utiliser findLivreursDisponiblesFIFO
    @Deprecated
    @Query("SELECT u FROM User u WHERE u.role = 'LIVREUR' AND u.statutLivreur = :statut ORDER BY u.id ASC")
    List<User> findLivreursParStatut(@Param("statut") StatutLivreur statut);
}
