package com.aurelia.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Le nom du produit est obligatoire")
    private String name;

    private String description;

    @NotNull(message = "Le prix est obligatoire")
    @Min(value = 0, message = "Le prix doit être positif")
    private BigDecimal price;

    @NotNull(message = "Le stock est obligatoire")
    @Min(value = 0, message = "Le stock doit être positif")
    private Integer stock;

    private String image;
}
