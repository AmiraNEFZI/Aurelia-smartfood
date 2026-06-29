package com.aurelia.backend.dto.response;

import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutLivreur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Role role;
    private StatutLivreur statutLivreur;
}
