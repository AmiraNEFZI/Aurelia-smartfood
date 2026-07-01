package com.aurelia.backend.repository;

import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutLivreur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    // Trouver les livreurs disponibles — FIFO : trié par id ASC (le plus ancien = premier assigné)
    @Query("SELECT u FROM User u WHERE u.role = 'LIVREUR' AND u.statutLivreur = :statut ORDER BY u.id ASC")
    List<User> findLivreursParStatut(StatutLivreur statut);
}
