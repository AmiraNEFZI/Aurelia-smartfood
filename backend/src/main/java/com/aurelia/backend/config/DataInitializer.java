package com.aurelia.backend.config;

import com.aurelia.backend.entity.Product;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.repository.ProductRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Override
    public void run(String... args) {
        normalizeUserContacts();
        migrateEnLigneStatus(); // DOIT être avant resetAllPasswords

        boolean resetPasswords = Boolean.parseBoolean(
                environment.getProperty("app.init.reset-passwords", "false"));
        if (resetPasswords) {
            resetAllPasswords();
        } else {
            log.info("⚠️ resetAllPasswords() skipped (app.init.reset-passwords=false)");
        }

        initAdmin();
        initProducts();
    }

    private void initAdmin() {
        // Toujours mettre à jour le mot de passe admin au démarrage pour garantir la cohérence
        User admin;
        if (userRepository.existsByEmail("admin@smartfood.com")) {
            admin = userRepository.findByEmail("admin@smartfood.com").orElseThrow();
        } else {
            admin = User.builder()
                    .firstName("Admin")
                    .lastName("SmartFood")
                    .email("admin@smartfood.com")
                    .role(Role.ADMIN)
                    .build();
        }
        // Force le mot de passe à admin123 à chaque démarrage
        admin.setPassword(passwordEncoder.encode("admin123"));
        userRepository.save(admin);
        log.info("✅ Admin prêt : admin@smartfood.com");

        // Réinitialiser le mot de passe du livreur de test
        userRepository.findByEmail("aymen@gmail.com").ifPresent(livreur -> {
            livreur.setPassword(passwordEncoder.encode("livreur123"));
            userRepository.save(livreur);
            log.info("✅ Livreur prêt : aymen@gmail.com");
        });
    }

    private void normalizeUserContacts() {
        List<User> users = userRepository.findAll();
        boolean changed = false;

        for (User user : users) {
            String normalizedEmail = normalizeEmail(user.getEmail());
            if (normalizedEmail != null && !normalizedEmail.equals(user.getEmail())) {
                user.setEmail(normalizedEmail);
                changed = true;
            }

            String normalizedPhone = normalizePhone(user.getPhone());
            if (normalizedPhone != null && !normalizedPhone.equals(user.getPhone())) {
                user.setPhone(normalizedPhone);
                changed = true;
            }
        }

        if (changed) {
            userRepository.saveAll(users);
            log.info("✅ Contacts utilisateurs normalisés pour les notifications");
        }
    }

    @SuppressWarnings("deprecation")
    private void migrateEnLigneStatus() {
        List<User> livreursEnLigne = userRepository.findAll().stream()
                .filter(u -> u.getStatutLivreur() == StatutLivreur.EN_LIGNE)
                .toList();

        if (livreursEnLigne.isEmpty())
            return;

        for (User u : livreursEnLigne) {
            u.setStatutLivreur(StatutLivreur.DISPONIBLE);
        }
        userRepository.saveAll(livreursEnLigne);
        log.info("✅ Migration EN_LIGNE → DISPONIBLE : {} compte(s)", livreursEnLigne.size());
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String normalized = email.trim().toLowerCase();
        if (!normalized.contains("@")) {
            return normalized;
        }
        String[] parts = normalized.split("@", 2);
        String domain = parts[1];
        if (domain.equals("gmailcom")) {
            domain = "gmail.com";
        } else if (domain.equals("yahooom")) {
            domain = "yahoo.com";
        } else if (domain.contains("gmailcom")) {
            domain = domain.replace("gmailcom", "gmail.com");
        } else if (domain.contains("yahooom")) {
            domain = domain.replace("yahooom", "yahoo.com");
        }
        return parts[0] + "@" + domain;
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String normalized = phone.trim().replaceAll("[^0-9+]", "");
        if (normalized.length() == 8 && !normalized.startsWith("+")) {
            normalized = "+216" + normalized;
        }
        return normalized;
    }

    private void resetAllPasswords() {
        List<User> allUsers = userRepository.findAll();
        Map<String, String> specificPasswords = new HashMap<>();
        specificPasswords.put("admin@smartfood.com", "admin123");
        specificPasswords.put("aymen@gmail.com", "livreur123");
        specificPasswords.put("amiranefzi2003@gmail.com", "client123");
        specificPasswords.put("yassemine@gmail.com", "client123");
        specificPasswords.put("aymenn@gmail.com", "client123");

        for (User user : allUsers) {
            String email = user.getEmail();
            String newPassword = specificPasswords.getOrDefault(email, switch (user.getRole()) {
                case ADMIN -> "admin123";
                case LIVREUR -> "livreur123";
                case CLIENT -> "client123";
            });

            try {
                if (!passwordEncoder.matches(newPassword, user.getPassword())) {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                    log.info("✅ Mot de passe réinitialisé pour : {}", email);
                }
            } catch (Exception e) {
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                log.info("✅ Hash corrigé pour : {}", email);
            }
        }
    }

    private void initProducts() {
        if (productRepository.count() > 0) {
            return; // Produits déjà insérés
        }

        List<Product> products = List.of(
            Product.builder()
                .name("Banane Bio")
                .description("Bananes biologiques fraîches, riches en potassium. "
                        + "Idéales pour les smoothies et les petits-déjeuners.")
                .price(new BigDecimal("2.99"))
                .stock(100)
                .image("/assets/img/fruite-item-3.jpg")
                .build(),

            Product.builder()
                .name("Orange Navel")
                .description("Oranges juteuses et sucrées, sans pépins. "
                        + "Source naturelle de vitamine C.")
                .price(new BigDecimal("3.49"))
                .stock(80)
                .image("/assets/img/fruite-item-1.jpg")
                .build(),

            Product.builder()
                .name("Raisins Muscat")
                .description("Raisins muscat doux et parfumés, cultivés sans pesticides. "
                        + "Parfaits en dessert ou en encas.")
                .price(new BigDecimal("4.99"))
                .stock(60)
                .image("/assets/img/fruite-item-5.jpg")
                .build(),

            Product.builder()
                .name("Brocoli Frais")
                .description("Brocoli vert frais, riche en fibres et en vitamines. "
                        + "Récolté du jour, livré directement.")
                .price(new BigDecimal("3.35"))
                .stock(50)
                .image("/assets/img/vegetable-item-2.jpg")
                .build(),

            Product.builder()
                .name("Tomates Cerises")
                .description("Tomates cerises rouges et savoureuses, cultivées en plein air. "
                        + "Idéales pour les salades et les antipasti.")
                .price(new BigDecimal("3.99"))
                .stock(70)
                .image("/assets/img/vegetable-item-1.jpg")
                .build()
        );

        productRepository.saveAll(products);
        log.info("✅ 5 produits initialisés en base de données.");
    }
}
