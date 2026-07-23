package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.CreateDriverRequest;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Créer un compte livreur — réservé à l'admin.
     * Le livreur démarre HORS_LIGNE et doit se mettre DISPONIBLE manuellement.
     */
    @Transactional
    public UserResponse createDriver(CreateDriverRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Un compte avec cet email existe déjà.");
        }

        User driver = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.LIVREUR)
                .statutLivreur(StatutLivreur.HORS_LIGNE)
                .disponibleDepuis(null)
                .build();

        return toResponse(userRepository.save(driver));
    }

    /**
     * Liste de tous les livreurs.
     */
    public List<UserResponse> getAllDrivers() {
        return userRepository.findByRole(Role.LIVREUR)
                .stream().map(this::toResponse).toList();
    }

    /**
     * Mettre à jour le statut de disponibilité du livreur connecté.
     *
     * Règles :
     * - EN_LIGNE (déprécié) → remappé silencieusement vers DISPONIBLE.
     * - Passage à DISPONIBLE → enregistre le timestamp disponibleDepuis (FIFO).
     * - Passage à HORS_LIGNE ou OCCUPE → efface disponibleDepuis.
     * - Un livreur OCCUPE ne peut pas se mettre DISPONIBLE lui-même
     *   (la libération se fait automatiquement par le système à la livraison).
     */
    @Transactional
    public UserResponse updateStatus(String email, StatutLivreur newStatus) {
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable."));

        if (driver.getRole() != Role.LIVREUR) {
            throw new BusinessException("Cet utilisateur n'est pas un livreur.");
        }

        // EN_LIGNE déprécié → remapper vers DISPONIBLE silencieusement
        @SuppressWarnings("deprecation")
        StatutLivreur effectiveStatus = (newStatus == StatutLivreur.EN_LIGNE)
                ? StatutLivreur.DISPONIBLE
                : newStatus;

        // Un livreur OCCUPE ne peut pas se déclarer DISPONIBLE manuellement.
        // Il peut se mettre HORS_LIGNE (déconnexion d'urgence autorisée).
        if (driver.getStatutLivreur() == StatutLivreur.OCCUPE
                && effectiveStatus == StatutLivreur.DISPONIBLE) {
            throw new BusinessException(
                "Vous êtes en cours de livraison. " +
                "Le système vous remettra automatiquement DISPONIBLE après confirmation de la livraison.");
        }

        applyStatus(driver, effectiveStatus);
        User saved = userRepository.save(driver);
        log.info("Livreur {} → statut {} (disponibleDepuis={})",
                saved.getEmail(), saved.getStatutLivreur(), saved.getDisponibleDepuis());
        return toResponse(saved);
    }

    /**
     * Applique le statut et gère le timestamp disponibleDepuis.
     * Méthode package-private pour être réutilisée par AssignationService.
     */
    void applyStatus(User driver, StatutLivreur newStatus) {
        driver.setStatutLivreur(newStatus);
        if (newStatus == StatutLivreur.DISPONIBLE) {
            // Enregistre le moment exact où le livreur devient disponible → FIFO précis
            driver.setDisponibleDepuis(LocalDateTime.now());
        } else {
            // Efface le timestamp — le livreur n'est plus dans la file FIFO
            driver.setDisponibleDepuis(null);
        }
    }

    /**
     * Supprimer un livreur — réservé à l'admin.
     */
    @Transactional
    public void deleteDriver(Long id) {
        User driver = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable : " + id));
        if (driver.getRole() != Role.LIVREUR) {
            throw new BusinessException("Cet utilisateur n'est pas un livreur.");
        }
        userRepository.delete(driver);
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .statutLivreur(user.getStatutLivreur())
                .active(user.getActive())
                .build();
    }
}
