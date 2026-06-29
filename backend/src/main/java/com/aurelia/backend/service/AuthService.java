package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.LoginRequest;
import com.aurelia.backend.dto.request.RegisterRequest;
import com.aurelia.backend.dto.response.AuthResponse;
import com.aurelia.backend.entity.Cart;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.repository.CartRepository;
import com.aurelia.backend.repository.UserRepository;
import com.aurelia.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    /**
     * Inscription client uniquement — les admins et livreurs sont créés par l'admin.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Un compte avec cet email existe déjà.");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CLIENT)
                .build();

        userRepository.save(user);

        // Créer automatiquement un panier vide pour le client
        Cart cart = Cart.builder().user(user).build();
        cartRepository.save(cart);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return buildAuthResponse(user, token);
    }

    /**
     * Connexion pour tous les rôles (CLIENT, LIVREUR, ADMIN).
     */
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
