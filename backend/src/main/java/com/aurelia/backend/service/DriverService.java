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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Créer un compte livreur — réservé à l'admin.
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
     */
    @Transactional
    public UserResponse updateStatus(String email, StatutLivreur newStatus) {
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Livreur introuvable."));

        if (driver.getRole() != Role.LIVREUR) {
            throw new BusinessException("Cet utilisateur n'est pas un livreur.");
        }

        // Le livreur peut changer son statut librement
        driver.setStatutLivreur(newStatus);
        return toResponse(userRepository.save(driver));
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

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .statutLivreur(user.getStatutLivreur())
                .build();
    }
}
