package com.aurelia.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SuspendDriverRequest {
    @NotBlank(message = "La raison de suspension est obligatoire.")
    private String reason;
}
