package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.SubmitComplaintRequest;
import com.aurelia.backend.dto.request.SuspendDriverRequest;
import com.aurelia.backend.dto.response.DriverComplaintResponse;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.entity.DriverComplaint;
import com.aurelia.backend.entity.DriverComplaint.ComplaintCategory;
import com.aurelia.backend.entity.Order;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.DriverComplaintRepository;
import com.aurelia.backend.repository.OrderRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverComplaintService {

    private final DriverComplaintRepository complaintRepository;
    private final OrderRepository           orderRepository;
    private final UserRepository            userRepository;
    private final BrevoService              brevoService;

    // Labels lisibles pour les catégories
    private static final Map<ComplaintCategory, String> CATEGORY_LABELS = Map.of(
        ComplaintCategory.RETARD_LIVRAISON,         "Retard de livraison",
        ComplaintCategory.COMPORTEMENT_INAPPROPRIE, "Comportement inapproprié",
        ComplaintCategory.COLIS_ENDOMMAGE,          "Colis endommagé",
        ComplaintCategory.LIVRAISON_INCORRECTE,     "Livraison incorrecte",
        ComplaintCategory.AUTRE,                    "Autre"
    );

    // ── Réclamation client ────────────────────────────────────────────────────

    /**
     * Soumet une réclamation après livraison.
     * Une seule réclamation par commande (contrainte unique en BD).
     */
    @Transactional
    public DriverComplaintResponse submitComplaint(Long orderId, String clientEmail,
                                                   SubmitComplaintRequest req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + orderId));
        User client = userRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        if (!order.getUser().getId().equals(client.getId()))
            throw new BusinessException("Vous ne pouvez signaler que vos propres commandes.");
        if (order.getStatus() != StatutCommande.LIVREE)
            throw new BusinessException("Une réclamation ne peut être soumise que pour une commande livrée.");
        if (order.getDriver() == null)
            throw new BusinessException("Aucun livreur associé à cette commande.");
        if (complaintRepository.existsByOrderId(orderId))
            throw new BusinessException("Vous avez déjà soumis une réclamation pour cette commande.");

        DriverComplaint complaint = DriverComplaint.builder()
                .order(order)
                .client(client)
                .driver(order.getDriver())
                .category(req.getCategory())
                .description(req.getDescription().trim())
                .build();

        DriverComplaint saved = complaintRepository.save(complaint);
        log.info("Réclamation #{} soumise par {} pour commande #{}", saved.getId(), clientEmail, orderId);
        return toResponse(saved);
    }

    // ── Lecture livreur ───────────────────────────────────────────────────────

    /** Réclamations reçues par le livreur connecté. */
    public List<DriverComplaintResponse> getMyComplaints(String driverEmail) {
        User driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable."));
        return complaintRepository.findByDriverIdOrderByCreatedAtDesc(driver.getId())
                .stream().map(this::toResponse).toList();
    }

    // ── Lecture admin ─────────────────────────────────────────────────────────

    /** Réclamations d'un livreur donné — vue admin. */
    public List<DriverComplaintResponse> getComplaintsForDriver(Long driverId) {
        return complaintRepository.findByDriverIdOrderByCreatedAtDesc(driverId)
                .stream().map(this::toResponse).toList();
    }

    /** Toutes les réclamations — vue admin globale. */
    public List<DriverComplaintResponse> getAllComplaints() {
        return complaintRepository.findAll().stream().map(this::toResponse).toList();
    }

    // ── Suspension / Réactivation ─────────────────────────────────────────────

    /**
     * Suspend le compte d'un livreur.
     * active = false, statutLivreur = HORS_LIGNE, suspensionReason = raison.
     * Envoie un email au livreur avec la raison.
     */
    @Transactional
    public UserResponse suspendDriver(Long driverId, SuspendDriverRequest req) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + driverId));
        if (driver.getRole() != Role.LIVREUR)
            throw new BusinessException("Cet utilisateur n'est pas un livreur.");
        if (!Boolean.TRUE.equals(driver.getActive()))
            throw new BusinessException("Ce compte est déjà suspendu.");

        driver.setActive(false);
        driver.setStatutLivreur(StatutLivreur.HORS_LIGNE);
        driver.setSuspensionReason(req.getReason());
        userRepository.save(driver);

        log.warn("Livreur {} suspendu. Raison : {}", driver.getEmail(), req.getReason());

        // Email de notification au livreur
        sendSuspensionEmail(driver, req.getReason());

        return toUserResponse(driver);
    }

    /**
     * Réactive le compte d'un livreur suspendu.
     * active = true, suspensionReason = null.
     * Envoie un email de réactivation.
     */
    @Transactional
    public UserResponse reactivateDriver(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + driverId));
        if (driver.getRole() != Role.LIVREUR)
            throw new BusinessException("Cet utilisateur n'est pas un livreur.");
        if (Boolean.TRUE.equals(driver.getActive()))
            throw new BusinessException("Ce compte est déjà actif.");

        driver.setActive(true);
        driver.setStatutLivreur(StatutLivreur.HORS_LIGNE);
        driver.setSuspensionReason(null);
        userRepository.save(driver);

        log.info("Livreur {} réactivé.", driver.getEmail());

        // Email de réactivation
        sendReactivationEmail(driver);

        return toUserResponse(driver);
    }

    // ── Emails ────────────────────────────────────────────────────────────────

    private void sendSuspensionEmail(User driver, String reason) {
        String name = driver.getFirstName() + " " + driver.getLastName();
        String subject = "Compte Aurelia SmartFood — Suspension de votre accès";

        String html = "<div style=\"font-family:Arial,sans-serif;background:#f3f7fb;padding:24px;\">"
            + "<div style=\"max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(11,31,78,0.10);\">"
            + "<div style=\"background:#b91c1c;color:#fff;padding:24px;text-align:center;\">"
            + "<h1 style=\"margin:0;font-size:22px;\">Suspension de compte</h1>"
            + "</div>"
            + "<div style=\"padding:28px;\">"
            + "<p style=\"font-size:15px;font-weight:600;color:#102a43;\">Bonjour " + name + ",</p>"
            + "<p style=\"font-size:14px;color:#334e68;line-height:1.7;\">Nous vous informons que votre compte livreur sur la plateforme <strong>Aurelia Smart Food</strong> a été temporairement suspendu par notre équipe d'administration.</p>"
            + "<div style=\"background:#fff5f5;border-left:4px solid #b91c1c;border-radius:8px;padding:16px;margin:20px 0;\">"
            + "<p style=\"margin:0 0 6px;font-size:13px;font-weight:700;color:#b91c1c;\">Motif de la suspension :</p>"
            + "<p style=\"margin:0;font-size:14px;color:#334e68;\">" + reason + "</p>"
            + "</div>"
            + "<p style=\"font-size:14px;color:#334e68;line-height:1.7;\">Si vous pensez que cette décision est erronée ou souhaitez contester cette suspension, veuillez contacter notre équipe support.</p>"
            + "<p style=\"font-size:13px;color:#8898aa;margin-top:24px;\">L'équipe Aurelia Smart Food</p>"
            + "</div></div></div>";

        String text = "Bonjour " + name + ",\n\nVotre compte livreur a été suspendu.\nMotif : " + reason
                + "\n\nContactez le support si vous souhaitez contester cette décision.\n\nAurelia Smart Food";

        try {
            brevoService.sendEmail(driver.getEmail(), name, subject, html, text);
        } catch (Exception e) {
            log.error("Échec envoi email suspension livreur {} : {}", driver.getEmail(), e.getMessage());
        }
    }

    private void sendReactivationEmail(User driver) {
        String name = driver.getFirstName() + " " + driver.getLastName();
        String subject = "Compte Aurelia SmartFood — Votre accès a été réactivé";

        String html = "<div style=\"font-family:Arial,sans-serif;background:#f3f7fb;padding:24px;\">"
            + "<div style=\"max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(11,31,78,0.10);\">"
            + "<div style=\"background:linear-gradient(135deg,#0b1f4e,#1f7a8c);color:#fff;padding:24px;text-align:center;\">"
            + "<h1 style=\"margin:0;font-size:22px;\">Compte réactivé ✅</h1>"
            + "</div>"
            + "<div style=\"padding:28px;\">"
            + "<p style=\"font-size:15px;font-weight:600;color:#102a43;\">Bonjour " + name + ",</p>"
            + "<p style=\"font-size:14px;color:#334e68;line-height:1.7;\">Nous sommes heureux de vous informer que votre compte livreur sur <strong>Aurelia Smart Food</strong> a été réactivé. Vous pouvez désormais vous reconnecter et reprendre vos livraisons.</p>"
            + "<p style=\"font-size:14px;color:#334e68;line-height:1.7;\">Nous vous remercions pour votre compréhension et espérons vous retrouver parmi nos livreurs actifs très prochainement.</p>"
            + "<p style=\"font-size:13px;color:#8898aa;margin-top:24px;\">L'équipe Aurelia Smart Food</p>"
            + "</div></div></div>";

        String text = "Bonjour " + name + ",\n\nVotre compte livreur a été réactivé. Vous pouvez vous reconnecter.\n\nAurelia Smart Food";

        try {
            brevoService.sendEmail(driver.getEmail(), name, subject, html, text);
        } catch (Exception e) {
            log.error("Échec envoi email réactivation livreur {} : {}", driver.getEmail(), e.getMessage());
        }
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    public DriverComplaintResponse toResponse(DriverComplaint c) {
        return DriverComplaintResponse.builder()
                .id(c.getId())
                .orderId(c.getOrder().getId())
                .driverId(c.getDriver().getId())
                .driverName(c.getDriver().getFirstName() + " " + c.getDriver().getLastName())
                .clientName(c.getClient().getFirstName() + " " + c.getClient().getLastName())
                .category(c.getCategory())
                .categoryLabel(CATEGORY_LABELS.getOrDefault(c.getCategory(), c.getCategory().name()))
                .description(c.getDescription())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private UserResponse toUserResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole())
                .statutLivreur(u.getStatutLivreur())
                .active(u.getActive())
                .build();
    }
}
