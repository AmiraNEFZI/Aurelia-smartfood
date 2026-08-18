package com.aurelia.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@Slf4j
public class BrevoService {

    private static final String EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";
    private static final String SMS_API_URL = "https://api.brevo.com/v3/transactionalSMS/sms";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9\\s.-]{7,15}$");

    private final RestTemplate restTemplate = new RestTemplate();
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;
    private final String smsSender;
    private final boolean smsEnabled;

    public BrevoService(
            @Value("${brevo.api.key}") String apiKey,
            @Value("${brevo.sender.email}") String senderEmail,
            @Value("${brevo.sender.name}") String senderName,
            @Value("${brevo.sender.sms}") String smsSender,
            @Value("${brevo.sms.enabled:true}") boolean smsEnabled) {
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.smsSender = smsSender;
        this.smsEnabled = smsEnabled;
    }

    public void sendEmail(String recipientEmail, String recipientName, String subject,
                          String htmlContent, String textContent) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Brevo email skipped: missing API key");
            return;
        }
        if (senderEmail == null || senderEmail.isBlank()) {
            log.warn("Brevo email skipped: sender email not configured");
            return;
        }
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Brevo email skipped: recipient email missing");
            return;
        }
        String normalizedRecipientEmail = normalizeEmail(recipientEmail);
        if (!isValidEmail(normalizedRecipientEmail)) {
            log.warn("Brevo email skipped: invalid recipient email '{}'", recipientEmail);
            return;
        }
        String effectiveSenderEmail = resolveSenderEmail(senderEmail);
        if (!isValidEmail(effectiveSenderEmail)) {
            log.warn("Brevo email skipped: sender email '{}' is invalid", effectiveSenderEmail);
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", Map.of("name", senderName, "email", effectiveSenderEmail));
        payload.put("to", Collections.singletonList(
                Map.of("email", normalizedRecipientEmail, "name", recipientName == null ? "" : recipientName)));
        payload.put("subject", subject);
        payload.put("htmlContent", htmlContent);
        payload.put("textContent", textContent);
        // En-têtes anti-spam : améliore la délivrabilité et évite le dossier spam
        payload.put("headers", Map.of(
            "X-Mailer", "Aurelia-SmartFood-v1",
            "Reply-To", effectiveSenderEmail
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            var response = restTemplate.postForEntity(EMAIL_API_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Brevo email envoyé à {} [status={}]", normalizedRecipientEmail, response.getStatusCode());
            } else {
                log.error("❌ Brevo email à {} — statut {}: {}", normalizedRecipientEmail,
                        response.getStatusCode(), response.getBody());
            }
        } catch (RestClientException ex) {
            // Extraire le corps de la réponse HTTP pour voir le vrai message d'erreur Brevo
            String detail = ex.getMessage() != null ? ex.getMessage() : "no detail";
            log.error("❌ Brevo email échoué vers {} — sender={} — erreur: {}",
                    normalizedRecipientEmail, effectiveSenderEmail, detail);
        }
    }

    public void sendSms(String recipientPhone, String message) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Brevo SMS skipped: missing API key");
            return;
        }
        if (!smsEnabled) {
            log.info("Brevo SMS skipped: disabled by configuration");
            return;
        }
        if (smsSender == null || smsSender.isBlank()) {
            log.warn("Brevo SMS skipped: sender SMS not configured");
            return;
        }
        if (recipientPhone == null || recipientPhone.isBlank()) {
            log.warn("Brevo SMS skipped: recipient phone missing");
            return;
        }
        String normalizedRecipientPhone = normalizePhone(recipientPhone);
        if (!isValidPhone(normalizedRecipientPhone)) {
            log.warn("Brevo SMS skipped: invalid recipient phone '{}'", recipientPhone);
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", smsSender);
        payload.put("recipient", normalizedRecipientPhone);
        payload.put("content", message);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            var response = restTemplate.postForEntity(SMS_API_URL, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Brevo SMS sent to {} [status={}]", recipientPhone, response.getStatusCode());
            } else {
                log.error("Brevo SMS to {} returned status {}: {}", recipientPhone,
                        response.getStatusCode(), response.getBody());
            }
        } catch (RestClientException ex) {
            log.error("Brevo SMS failed to {}: {}", recipientPhone, ex.getMessage(), ex);
        }
    }

    /**
     * Résout l'email expéditeur.
     * La logique de fallback vers hello@aurelia-smartfood.com est supprimée :
     * elle causait des rejets Brevo car ce domaine n'est pas vérifié.
     * On utilise directement l'email configuré dans application.properties.
     * L'email configuré DOIT être vérifié comme sender dans le dashboard Brevo.
     */
    String resolveSenderEmail(String configuredSenderEmail) {
        if (configuredSenderEmail == null || configuredSenderEmail.isBlank()) {
            log.error("Brevo sender email non configuré — vérifiez brevo.sender.email dans application.properties");
            return "";
        }
        return configuredSenderEmail.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("\\s+", "");
        if (!normalized.contains("@")) {
            return normalized;
        }
        String[] parts = normalized.split("@", 2);
        String localPart = parts[0];
        String domain = parts[1];

        if (domain.equals("gmailcom")) {
            domain = "gmail.com";
        } else if (domain.equals("yahooom")) {
            domain = "yahoo.com";
        } else if (domain.equals("outlookcom")) {
            domain = "outlook.com";
        } else if (domain.equals("livecom")) {
            domain = "live.com";
        } else if (domain.contains("gmailcom")) {
            domain = domain.replace("gmailcom", "gmail.com");
        } else if (domain.contains("yahooom")) {
            domain = domain.replace("yahooom", "yahoo.com");
        } else if (domain.contains("outlookcom")) {
            domain = domain.replace("outlookcom", "outlook.com");
        }

        return localPart + "@" + domain;
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String normalized = phone.trim().replaceAll("[^0-9+]", "");
        if (normalized.isBlank()) {
            return normalized;
        }
        if (normalized.startsWith("00")) {
            normalized = "+" + normalized.substring(2);
        }
        if (normalized.length() == 8 && !normalized.startsWith("+")) {
            normalized = "+216" + normalized;
        }
        return normalized;
    }

    private boolean isValidEmail(String email) {
        return email != null && !email.isBlank() && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    private boolean isValidPhone(String phone) {
        return phone != null && !phone.isBlank() && PHONE_PATTERN.matcher(phone.trim()).matches();
    }
}
