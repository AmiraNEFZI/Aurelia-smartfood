package com.aurelia.backend.dto.request;

import com.aurelia.backend.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "Le téléphone est obligatoire")
    private String phone;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

    @NotBlank(message = "Le mot de passe temporaire est obligatoire")
    @Size(min = 6, message = "Minimum 6 caractères")
    private String password;

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    private Boolean active = true;
}
