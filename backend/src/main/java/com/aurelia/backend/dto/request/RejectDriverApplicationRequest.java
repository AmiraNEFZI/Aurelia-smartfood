package com.aurelia.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectDriverApplicationRequest {

    @NotBlank(message = "La raison du rejet est obligatoire")
    private String reason;
}
