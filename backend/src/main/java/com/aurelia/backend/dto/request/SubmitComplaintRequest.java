package com.aurelia.backend.dto.request;

import com.aurelia.backend.entity.DriverComplaint.ComplaintCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitComplaintRequest {
    @NotNull(message = "La catégorie est obligatoire.")
    private ComplaintCategory category;

    @NotBlank(message = "La description est obligatoire.")
    private String description;
}
