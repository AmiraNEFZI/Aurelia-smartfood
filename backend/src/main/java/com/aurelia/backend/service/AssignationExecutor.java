package com.aurelia.backend.service;

import com.aurelia.backend.entity.Order;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.repository.OrderRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
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
    private final BrevoService    brevoService;

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

        try {
            order.setDriver(livreur);
            order.setStatus(StatutCommande.PRISE_EN_CHARGE);
            orderRepository.save(order); // @Version protège contre double-assignation

            // Passe le livreur OCCUPE — disponibleDepuis mis à null (hors file FIFO)
            driverService.applyStatus(livreur, StatutLivreur.OCCUPE);
            userRepository.save(livreur);

            log.info("✅ Commande #{} assignée à {} (FIFO — disponible depuis {})",
                    orderId, livreur.getEmail(), livreur.getDisponibleDepuis());

            notifyDriverAssignment(order, livreur);
            return true;
        } catch (OptimisticLockingFailureException ole) {
            log.warn("Optimistic locking lors de l'assignation commande #{} : {}", orderId, ole.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Erreur lors de l'assignation commande #{} : {}", orderId, e.getMessage());
            return false;
        }
    }

    private void notifyDriverAssignment(Order order, User driver) {
        if (order == null || driver == null) {
            return;
        }
        String recipientName = driver.getFirstName() + " " + driver.getLastName();
        String subject = "Nouvelle commande assignée : #" + order.getId();

        String htmlContent = "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f3f7fb;color:#102a43;padding:24px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 35px rgba(16,42,67,0.12);\">"
                + "<div style=\"background:#1f7a8c;color:#ffffff;padding:24px;text-align:center;\">"
                + "<h1 style=\"margin:0;font-size:24px;\">Nouvelle commande assignée</h1>"
                + "</div>"
                + "<div style=\"padding:24px;\">"
                + "<p style=\"margin:0 0 16px;font-size:16px;font-weight:600;color:#102a43;\">Bonjour " + recipientName + ",</p>"
                + "<p style=\"margin:0 0 18px;font-size:14px;color:#334e68;line-height:1.6;\">Vous venez d'être assigné à une nouvelle commande.</p>"
                + "<div style=\"background:#eef6fb;border-radius:14px;padding:18px;margin-bottom:20px;\">"
                + "<p style=\"margin:0 0 10px;font-size:15px;color:#0b3c5d;font-weight:700;\">Commande #" + order.getId() + "</p>"
                + "<p style=\"margin:0 0 6px;font-size:14px;color:#334e68;\"><strong>Client :</strong> "
                + order.getUser().getFirstName() + " " + order.getUser().getLastName() + "</p>"
                + "<p style=\"margin:0 0 6px;font-size:14px;color:#334e68;\"><strong>Adresse :</strong> " + order.getAddress() + "</p>"
                + "<p style=\"margin:0;font-size:14px;color:#334e68;\"><strong>Total :</strong> " + order.getTotalAmount() + " DT</p>"
                + "</div>"
                + "<p style=\"margin:0;font-size:14px;color:#334e68;\">Merci d'apporter une livraison rapide et soignée.</p>"
                + "</div></div></div>";

        String textContent = "Bonjour " + recipientName + ",\n\n"
                + "Vous avez été assigné à la commande #" + order.getId() + ".\n"
                + "Client : " + order.getUser().getFirstName() + " " + order.getUser().getLastName() + "\n"
                + "Adresse : " + order.getAddress() + "\n"
                + "Total : " + order.getTotalAmount() + " DT\n\n"
                + "Merci de prendre en charge cette livraison rapidement.";

        try {
            brevoService.sendEmail(driver.getEmail(), recipientName, subject, htmlContent, textContent);
            brevoService.sendSms(driver.getPhone(),
                    "Nouvelle commande #" + order.getId() + " assignée. Livraison à " + order.getAddress() + ".");
        } catch (Exception e) {
            log.warn("Notification livreur automatique échouée pour commande #{} : {}", order.getId(), e.getMessage());
        }
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
