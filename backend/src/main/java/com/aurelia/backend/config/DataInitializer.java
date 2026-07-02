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
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
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
        log.info("✅ Admin prêt : admin@smartfood.com / admin123");
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
