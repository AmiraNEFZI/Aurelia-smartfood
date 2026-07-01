package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.CreateUserRequest;
import com.aurelia.backend.dto.response.UserResponse;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Un compte avec cet email existe déjà.");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(request.getActive() == null ? true : request.getActive())
                .statutLivreur(request.getRole() == Role.LIVREUR ? StatutLivreur.HORS_LIGNE : null)
                .build();

        if (request.getRole() == Role.CLIENT) {
            // Créer automatiquement un panier vide pour le client
            userRepository.save(user);
        } else {
            userRepository.save(user);
        }

        return toResponse(user);
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
