package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.CreateDriverApplicationRequest;
import com.aurelia.backend.dto.response.DriverApplicationResponse;
import com.aurelia.backend.entity.DriverApplication;
import com.aurelia.backend.enums.DriverApplicationStatus;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.DriverApplicationRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverApplicationService {

    private final DriverApplicationRepository driverApplicationRepository;
    private final UserRepository userRepository;
    private final DriverService driverService;
    private final BrevoService brevoService;

    @Transactional
    public DriverApplicationResponse createApplication(CreateDriverApplicationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Un compte avec cet email existe déjà.");
        }
        if (driverApplicationRepository.existsByEmailAndStatus(request.getEmail(), DriverApplicationStatus.PENDING)) {
            throw new BusinessException("Une candidature en attente existe déjà pour cet email.");
        }

        DriverApplication application = DriverApplication.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .documentUrl(request.getDocumentUrl())
                .passwordHash("")
                .status(DriverApplicationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(driverApplicationRepository.save(application));
    }

    public List<DriverApplicationResponse> getApplications(DriverApplicationStatus status) {
        if (status == null) {
            return driverApplicationRepository.findAll().stream().map(this::toResponse).toList();
        }
        return driverApplicationRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    public DriverApplicationResponse getApplication(Long id) {
        return toResponse(findApplication(id));
    }

    @Transactional
    public DriverApplicationResponse approveApplication(Long id, String password) {
        DriverApplication application = findApplication(id);
        if (application.getStatus() != DriverApplicationStatus.PENDING) {
            throw new BusinessException("Cette candidature a déjà été traitée.");
        }
        if (userRepository.existsByEmail(application.getEmail())) {
            throw new BusinessException("Un compte existe déjà avec cet email.");
        }

        String generatedPassword = password != null && !password.isBlank()
                ? password
                : generateTemporaryPassword();

        driverService.createDriverFromPlainPassword(
                application.getFirstName(),
                application.getLastName(),
                application.getPhone(),
                application.getEmail(),
                generatedPassword);

        application.setStatus(DriverApplicationStatus.APPROVED);
        application.setUpdatedAt(LocalDateTime.now());
        DriverApplication saved = driverApplicationRepository.save(application);

        try {
            sendApprovalNotification(saved, generatedPassword);
        } catch (Exception e) {
            // Notification failures should not break approval flow.
        }

        DriverApplicationResponse response = toResponse(saved);
        response.setTemporaryPassword(generatedPassword);
        return response;
    }

    @Transactional
    public DriverApplicationResponse rejectApplication(Long id, String reason) {
        DriverApplication application = findApplication(id);
        if (application.getStatus() != DriverApplicationStatus.PENDING) {
            throw new BusinessException("Cette candidature a déjà été traitée.");
        }
        application.setStatus(DriverApplicationStatus.REJECTED);
        application.setRejectReason(reason);
        application.setUpdatedAt(LocalDateTime.now());
        DriverApplication saved = driverApplicationRepository.save(application);

        try {
            sendRejectionNotification(saved);
        } catch (Exception e) {
            // Notification failures should not break rejection flow.
        }

        return toResponse(saved);
    }

    private DriverApplication findApplication(Long id) {
        return driverApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature introuvable : " + id));
    }

    private String generateTemporaryPassword() {
        return "Livreur" + System.currentTimeMillis() % 100000;
    }

    private void sendApprovalNotification(DriverApplication application, String temporaryPassword) {
        String recipientName = application.getFirstName() + " " + application.getLastName();
        String subject = "Votre candidature livreur a été acceptée";
        String htmlContent = "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f3f7fb;color:#102a43;padding:24px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 35px rgba(16,42,67,0.12);\">"
                + "<div style=\"background:#1f7a8c;color:#ffffff;padding:24px;text-align:center;\">"
                + "<h1 style=\"margin:0;font-size:24px;\">Candidature acceptée ✅</h1>"
                + "</div>"
                + "<div style=\"padding:24px;\">"
                + "<p style=\"margin:0 0 16px;font-size:16px;font-weight:600;color:#102a43;\">Bonjour " + recipientName + ",</p>"
                + "<p style=\"margin:0 0 18px;font-size:14px;color:#334e68;line-height:1.6;\">Félicitations ! Votre candidature pour devenir livreur a été acceptée.</p>"
                + "<div style=\"background:#eef6fb;border-radius:14px;padding:18px;margin-bottom:20px;\">"
                + "<p style=\"margin:0 0 8px;font-weight:700;color:#0b3c5d;\">Informations de connexion</p>"
                + "<p style=\"margin:0 0 6px;color:#334e68;\"><strong>Email :</strong> " + application.getEmail() + "</p>"
                + "<p style=\"margin:0;color:#334e68;\"><strong>Mot de passe temporaire :</strong> " + temporaryPassword + "</p>"
                + "</div>"
                + "<p style=\"margin:0;font-size:14px;color:#334e68;\">Nous vous recommandons de changer ce mot de passe dès votre première connexion.</p>"
                + "</div></div></div>";
        String textContent = "Bonjour " + recipientName + ",\n\n"
                + "Félicitations ! Votre candidature pour devenir livreur a été acceptée.\n"
                + "Email : " + application.getEmail() + "\n"
                + "Mot de passe temporaire : " + temporaryPassword + "\n\n"
                + "Nous vous recommandons de changer ce mot de passe dès votre première connexion.";

        brevoService.sendEmail(application.getEmail(), recipientName, subject, htmlContent, textContent);
        brevoService.sendSms(application.getPhone(),
                "Votre candidature livreur est acceptée. Connectez-vous avec votre email et le mot de passe temporaire.");
    }

    private void sendRejectionNotification(DriverApplication application) {
        String recipientName = application.getFirstName() + " " + application.getLastName();
        String subject = "Votre candidature livreur a été rejetée";
        String htmlContent = "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f3f7fb;color:#102a43;padding:24px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 16px 35px rgba(16,42,67,0.12);\">"
                + "<div style=\"background:#0f4c75;color:#ffffff;padding:24px;text-align:center;\">"
                + "<h1 style=\"margin:0;font-size:24px;\">Candidature non retenue</h1>"
                + "</div>"
                + "<div style=\"padding:24px;\">"
                + "<p style=\"margin:0 0 16px;font-size:16px;font-weight:600;color:#102a43;\">Bonjour " + recipientName + ",</p>"
                + "<p style=\"margin:0 0 18px;font-size:14px;color:#334e68;line-height:1.6;\">Nous sommes désolés de vous informer que votre candidature pour devenir livreur n'a pas été retenue.</p>"
                + "<div style=\"background:#fee8e8;border-radius:14px;padding:18px;margin-bottom:20px;\">"
                + "<p style=\"margin:0;font-weight:700;color:#8a1538;\">Raison :</p>"
                + "<p style=\"margin:8px 0 0;color:#4b1d41;\">" + application.getRejectReason() + "</p>"
                + "</div>"
                + "<p style=\"margin:0;font-size:14px;color:#334e68;\">Merci d'avoir postulé. N'hésitez pas à retenter votre chance ultérieurement.</p>"
                + "</div></div></div>";
        String textContent = "Bonjour " + recipientName + ",\n\n"
                + "Nous sommes désolés de vous informer que votre candidature pour devenir livreur n'a pas été retenue.\n"
                + "Raison : " + application.getRejectReason() + "\n\n"
                + "Merci d'avoir postulé. N'hésitez pas à retenter votre chance ultérieurement.";

        brevoService.sendEmail(application.getEmail(), recipientName, subject, htmlContent, textContent);
        brevoService.sendSms(application.getPhone(),
                "Votre candidature livreur n'a pas été retenue. Raison : " + application.getRejectReason());
    }

    private DriverApplicationResponse toResponse(DriverApplication application) {
        return DriverApplicationResponse.builder()
                .id(application.getId())
                .firstName(application.getFirstName())
                .lastName(application.getLastName())
                .phone(application.getPhone())
                .email(application.getEmail())
                .documentUrl(application.getDocumentUrl())
                .rejectReason(application.getRejectReason())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}
