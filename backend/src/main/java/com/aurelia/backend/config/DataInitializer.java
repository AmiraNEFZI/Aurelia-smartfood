package com.aurelia.backend.config;

import com.aurelia.backend.entity.Product;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.repository.ProductRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
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

    @Override
    public void run(String... args) {
        resetAllPasswords();
        initProducts();
    }

    /**
     * Réinitialise les mots de passe de TOUS les comptes connus au démarrage.
     * Garantit que le hash BCrypt est toujours valide et cohérent.
     *
     * Mots de passe par défaut :
     *   admin@smartfood.com   → admin123
     *   Tous les LIVREUR      → livreur123
     *   Tous les CLIENT       → client123
     */
    private void resetAllPasswords() {
        List<User> allUsers = userRepository.findAll();

        // Mots de passe spécifiques par email
        Map<String, String> specificPasswords = new HashMap<>();
        specificPasswords.put("admin@smartfood.com",    "admin123");
        specificPasswords.put("aymen@gmail.com",        "livreur123");
        specificPasswords.put("amiranefzi2003@gmail.com", "client123");
        specificPasswords.put("yassemine@gmail.com",    "client123");
        specificPasswords.put("aymenn@gmail.com",       "client123");

        for (User user : allUsers) {
            String email = user.getEmail();
            String newPassword;

            if (specificPasswords.containsKey(email)) {
                newPassword = specificPasswords.get(email);
            } else {
                // Mot de passe par défaut selon le rôle
                newPassword = switch (user.getRole()) {
                    case ADMIN   -> "admin123";
                    case LIVREUR -> "livreur123";
                    case CLIENT  -> "client123";
                };
            }

            // Vérifier si le hash est déjà valide pour éviter un re-hash inutile
            try {
                if (!passwordEncoder.matches(newPassword, user.getPassword())) {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                    log.info("✅ Mot de passe réinitialisé : {} → {}", email, newPassword);
                }
            } catch (Exception e) {
                // Hash invalide/corrompu → forcer le reset
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                log.info("✅ Hash corrigé : {} → {}", email, newPassword);
            }
        }

        log.info("✅ Vérification des mots de passe terminée ({} comptes)", allUsers.size());
    }

    private void initProducts() {
        if (productRepository.count() > 0) {
            return;
        }

        List<Product> products = List.of(
            Product.builder()
                .name("Banane Bio")
                .description("Bananes biologiques fraîches, riches en potassium.")
                .price(new BigDecimal("2.99")).stock(100)
                .image("/assets/img/fruite-item-3.jpg").build(),
            Product.builder()
                .name("Orange Navel")
                .description("Oranges juteuses et sucrées, sans pépins.")
                .price(new BigDecimal("3.49")).stock(80)
                .image("/assets/img/fruite-item-1.jpg").build(),
            Product.builder()
                .name("Tomates Cerises")
                .description("Tomates cerises rouges et savoureuses.")
                .price(new BigDecimal("3.99")).stock(70)
                .image("/assets/img/vegetable-item-1.jpg").build()
        );

        productRepository.saveAll(products);
        log.info("✅ Produits initialisés.");
    }
}
