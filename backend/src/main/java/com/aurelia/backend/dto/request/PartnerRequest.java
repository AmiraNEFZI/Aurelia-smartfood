package com.aurelia.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PartnerRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String name;
    private String email;
    private String phone;
    private String address;
    private String contactPerson;
    private String website;
    private String description;
    private Boolean isActive = true;
}
