package com.aurelia.backend.service;

import com.aurelia.backend.entity.Order;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.repository.OrderRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Bean transactionnel dédié à l'assignation des commandes.
 *
 * Séparé de AssignationService pour que chaque appel passe par le proxy AOP Spring
 * → les @Transactional(REQUIRES_NEW) sont toujours honorés, même appelés depuis
 * un autre bean Spring.
 *
 * Règle absolue : aucune méthode n'appelle une autre méthode de ce même bean.
 * Les enchaînements sont orchestrés par AssignationService (via le proxy).
 *
 * ── Algorithme FIFO sur disponibleDepuis ──────────────────────────────────
 * Le livreur DISPONIBLE depuis le plus longtemps reçoit la prochaine commande.
 * Après livraison : disponibleDepuis = now() → le livreur libéré passe
 * automatiquement derrière ceux qui attendent déjà. Équité sans compteur.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssignationExecutor {

    private final OrderRepository orderRepository;
    private final UserRepository  userRepository;
    private final DriverService   driverService;

    // ══════════════════════════════════════════════════════════════════════
    // Lectures isolées pour les schedulers (readOnly + REQUIRES_NEW)
    // Transaction séparée → aucun risque de contaminer les opérations d'écriture
    // ══════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Long> lireCommandesSansLivreur(LocalDateTime cutoff) {
        return orderRepository.findCommandesSansLivreurAvant(cutoff)
                .stream().map(Order::getId).toList();
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Long> lireLivreursOccupesDepuisAvant(LocalDateTime cutoff) {
        return userRepository.findLivreursOccupesDepuisAvant(cutoff)
                .stream().map(User::getId).toList();
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Long> lireCommandesActivesAvantCutoff(Long livreurId, LocalDateTime cutoff) {
        return orderRepository.findCommandesActivesAvant(livreurId, cutoff)
                .stream().map(Order::getId).toList();
    }

    // ══════════════════════════════════════════════════════════════════════
    // Assignation FIFO — REQUIRES_NEW
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tente d'assigner la commande au livreur DISPONIBLE depuis le plus longtemps.
     *
     * Algorithme :
     *   1. Charge la commande — si déjà assignée ou non EN_ATTENTE → skip
     *   2. Récupère la liste FIFO triée par disponibleDepuis ASC
     *   3. Re-lit le premier candidat pour avoir son état le plus frais
     *   4. Assigne : order.driver = livreur, status → PRISE_EN_CHARGE
     *   5. Livreur → OCCUPE, disponibleDepuis → null (hors file)
     *
     * @Version sur Order protège contre la double assignation concurrente.
     * @return true si assignation réussie, false si aucun livreur disponible.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean tenterAssignation(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("tenterAssignation : commande #{} introuvable", orderId);
            return false;
        }

        if (order.getDriver() != null) {
            log.debug("Commande #{} déjà assignée — skip", orderId);
            return true;
        }
        if (order.getStatus() != StatutCommande.EN_ATTENTE) {
            log.debug("Commande #{} statut {} — skip assignation", orderId, order.getStatus());
            return false;
        }

        List<User> candidats = userRepository.findLivreursDisponiblesFIFO(StatutLivreur.DISPONIBLE);
        if (candidats.isEmpty()) {
            log.info("⏳ Aucun livreur disponible pour commande #{}", orderId);
            return false;
        }

        // Re-lire le premier candidat pour son état le plus frais en BD
        User livreur = userRepository.findById(candidats.get(0).getId()).orElse(null);
        if (livreur == null || livreur.getStatutLivreur() != StatutLivreur.DISPONIBLE) {
            log.warn("Livreur #{} plus disponible après re-lecture — commande #{} différée",
                    candidats.get(0).getId(), orderId);
            return false;
        }

        // Assignation directe
        order.setDriver(livreur);
        order.setStatus(StatutCommande.PRISE_EN_CHARGE);
        orderRepository.save(order); // @Version protège contre double-assignation

        // Passe le livreur OCCUPE — disponibleDepuis mis à null (hors file FIFO)
        driverService.applyStatus(livreur, StatutLivreur.OCCUPE);
        userRepository.save(livreur);

        log.info("✅ Commande #{} assignée à {} (FIFO — disponible depuis {})",
                orderId, livreur.getEmail(), livreur.getDisponibleDepuis());
        return true;
    }

    // ══════════════════════════════════════════════════════════════════════
    // Libération livreur
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Libère le livreur après livraison réussie (commande LIVREE).
     * disponibleDepuis = now() → entre en queue derrière ceux qui attendent déjà.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void libererLivreur(Long livreurId) {
        userRepository.findById(livreurId).ifPresent(livreur -> {
            driverService.applyStatus(livreur, StatutLivreur.DISPONIBLE);
            userRepository.save(livreur);
            log.info("✅ Livreur {} libéré → DISPONIBLE (dans la file FIFO depuis {})",
                    livreur.getEmail(), livreur.getDisponibleDepuis());
        });
    }

    /**
     * Libère le livreur après annulation de commande.
     * Même comportement : disponibleDepuis = now() → file FIFO.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void libererLivreurAnnulation(Long livreurId) {
        userRepository.findById(livreurId).ifPresent(livreur -> {
            driverService.applyStatus(livreur, StatutLivreur.DISPONIBLE);
            userRepository.save(livreur);
            log.info("✅ Livreur {} libéré (annulation) → DISPONIBLE", livreur.getEmail());
        });
    }

    /**
     * Libère un livreur bloqué (OCCUPE depuis > 3h sans activité).
     * Remet ses commandes PRISE_EN_CHARGE/EN_LIVRAISON EN_ATTENTE pour réassignation.
     * Les commandes déjà LIVREE ou ANNULEE ne sont jamais touchées.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void libererLivreurBloque(Long livreurId, List<Long> commandeIds) {
        User livreur = userRepository.findById(livreurId).orElse(null);
        if (livreur == null || livreur.getStatutLivreur() != StatutLivreur.OCCUPE) return;

        for (Long orderId : commandeIds) {
            orderRepository.findById(orderId).ifPresent(order -> {
                // Ne jamais toucher une commande déjà terminée (LIVREE ou ANNULEE)
                if (order.getStatus() == StatutCommande.LIVREE
                        || order.getStatus() == StatutCommande.ANNULEE) {
                    log.debug("Commande #{} déjà {} — ignorée par le scheduler de déblocage",
                            orderId, order.getStatus());
                    return;
                }
                order.setDriver(null);
                order.setStatus(StatutCommande.EN_ATTENTE);
                orderRepository.save(order);
                log.warn("🔓 Commande #{} remise EN_ATTENTE (livreur #{} bloqué)", orderId, livreurId);
            });
        }

        driverService.applyStatus(livreur, StatutLivreur.DISPONIBLE);
        userRepository.save(livreur);
        log.warn("🔓 Livreur {} libéré automatiquement après {}h sans activité",
                livreur.getEmail(), AssignationService.TIMEOUT_LIVREUR_BLOQUE_HEURES);
    }
}
