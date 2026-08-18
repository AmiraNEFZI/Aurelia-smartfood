package com.aurelia.backend.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class ApproveDriverApplicationRequest {

    @Size(min = 6, message = "Minimum 6 caractères")
    private String password;
}
