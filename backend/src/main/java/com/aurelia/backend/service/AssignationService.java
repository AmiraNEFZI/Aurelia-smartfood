package com.aurelia.backend.service;

import com.aurelia.backend.dto.response.OrderResponse;
import com.aurelia.backend.entity.Order;
import com.aurelia.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Orchestrateur du système d'assignation automatique des commandes aux livreurs.
 *
 * Délègue toutes les opérations BD à AssignationExecutor (bean séparé)
 * pour garantir que les @Transactional(REQUIRES_NEW) passent par le proxy Spring.
 *
 * ── Algorithme : FIFO pur sur disponibleDepuis ────────────────────────────
 * Le livreur DISPONIBLE depuis le plus longtemps reçoit la prochaine commande.
 * Après livraison : disponibleDepuis = now() → il passe derrière ceux qui
 * attendent déjà. L'équité se fait naturellement, sans compteur ni reset.
 *
 * ── Schedulers ────────────────────────────────────────────────────────────
 *   - Toutes les 60s   : rattrapage des commandes sans livreur depuis > 5 min
 *   - Toutes les 15min : libération des livreurs OCCUPE bloqués depuis > 3h
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssignationService {

    private final OrderRepository     orderRepository;
    private final AssignationExecutor assignationExecutor;

    // ── Constantes exposées à AssignationExecutor ───────────────────────────
    static final long SEUIL_RATTRAPAGE_MINUTES      = 5;
    static final long TIMEOUT_LIVREUR_BLOQUE_HEURES = 3;

    // ══════════════════════════════════════════════════════════════════════
    // API publique — appelée par OrderService
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Assigne la commande au premier livreur FIFO disponible.
     * Appelé immédiatement depuis checkout(), et en rattrapage par le scheduler.
     */
    public boolean tenterAssignation(Long orderId) {
        return assignationExecutor.tenterAssignation(orderId);
    }

    /**
     * Libère le livreur après livraison confirmée (commande LIVREE).
     * disponibleDepuis = now() → il entre en queue derrière les autres.
     */
    public void libererLivreur(Long livreurId) {
        assignationExecutor.libererLivreur(livreurId);
    }

    /**
     * Libère le livreur après annulation de commande.
     * Même comportement que libererLivreur : disponibleDepuis = now().
     */
    public void libererLivreurAnnulation(Long livreurId) {
        assignationExecutor.libererLivreurAnnulation(livreurId);
    }

    // ══════════════════════════════════════════════════════════════════════
    // Schedulers
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Toutes les 60 secondes : tente d'assigner les commandes EN_ATTENTE
     * sans livreur depuis plus de SEUIL_RATTRAPAGE_MINUTES minutes.
     *
     * Cas typique : aucun livreur n'était disponible au moment de la commande.
     * Dès qu'un livreur passe DISPONIBLE, ce scheduler l'assignera dans la minute.
     */
    @Scheduled(fixedDelay = 60_000)
    public void schedulerRattrapage() {
        List<Long> ids;
        try {
            ids = assignationExecutor.lireCommandesSansLivreur(
                    LocalDateTime.now().minusMinutes(SEUIL_RATTRAPAGE_MINUTES));
        } catch (Exception e) {
            log.error("Scheduler rattrapage — erreur lecture BD : {}", e.getMessage());
            return;
        }
        if (ids.isEmpty()) return;

        log.info("🔄 Rattrapage : {} commande(s) sans livreur depuis > {} min",
                ids.size(), SEUIL_RATTRAPAGE_MINUTES);
        for (Long id : ids) {
            try {
                assignationExecutor.tenterAssignation(id);
            } catch (Exception e) {
                log.error("Erreur rattrapage commande #{} : {}", id, e.getMessage());
            }
        }
    }

    /**
     * Toutes les 15 minutes : détecte et libère les livreurs OCCUPE
     * sans activité depuis plus de TIMEOUT_LIVREUR_BLOQUE_HEURES.
     *
     * Cas couverts : crash du livreur, connexion perdue, commande jamais finalisée.
     * Les commandes concernées sont remises EN_ATTENTE et réassignées.
     */
    @Scheduled(fixedDelay = 900_000)
    public void schedulerLibererLivreursBlockes() {
        List<Long> livreurIds;
        try {
            livreurIds = assignationExecutor.lireLivreursOccupesDepuisAvant(
                    LocalDateTime.now().minusHours(TIMEOUT_LIVREUR_BLOQUE_HEURES));
        } catch (Exception e) {
            log.error("Scheduler livreurs bloqués — erreur lecture BD : {}", e.getMessage());
            return;
        }
        if (livreurIds.isEmpty()) return;

        log.warn("🔓 {} livreur(s) OCCUPE depuis > {}h — libération automatique",
                livreurIds.size(), TIMEOUT_LIVREUR_BLOQUE_HEURES);

        for (Long livreurId : livreurIds) {
            try {
                LocalDateTime cutoff = LocalDateTime.now().minusHours(TIMEOUT_LIVREUR_BLOQUE_HEURES);
                // Lire les IDs des commandes bloquées dans une transaction readOnly séparée
                List<Long> commandeIds = assignationExecutor.lireCommandesActivesAvantCutoff(livreurId, cutoff);
                // Libère le livreur et remet les commandes EN_ATTENTE
                assignationExecutor.libererLivreurBloque(livreurId, commandeIds);
                // Réassigne immédiatement chaque commande libérée via FIFO
                for (Long orderId : commandeIds) {
                    try {
                        assignationExecutor.tenterAssignation(orderId);
                    } catch (Exception e2) {
                        log.error("Réassignation commande #{} après déblocage : {}", orderId, e2.getMessage());
                    }
                }
            } catch (Exception e) {
                log.error("Libération livreur bloqué #{} : {}", livreurId, e.getMessage());
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Lecture
    // ══════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByDriver(Long driverId) {
        return orderRepository.findByDriverIdOrderByOrderDateDesc(driverId)
                .stream().map(this::toOrderResponse).toList();
    }

    private OrderResponse toOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .clientName(order.getUser().getFirstName() + " " + order.getUser().getLastName())
                .driverId(order.getDriver() != null ? order.getDriver().getId() : null)
                .driverName(order.getDriver() != null
                        ? order.getDriver().getFirstName() + " " + order.getDriver().getLastName() : null)
                .address(order.getAddress())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .orderDate(order.getOrderDate())
                .items(List.of())
                .build();
    }
}
