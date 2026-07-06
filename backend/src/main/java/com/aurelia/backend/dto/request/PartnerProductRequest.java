package com.aurelia.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PartnerProductRequest {

    // Optionnel — requis uniquement pour la création (POST), pas pour la modif (PUT)
    private Long productId;

    @NotNull(message = "Le stock est obligatoire")
    @Min(value = 0, message = "Le stock ne peut pas être négatif")
    private Integer stock;

    @NotNull(message = "Le prix est obligatoire")
    private BigDecimal price;

    private Boolean isAvailable = true;
}
