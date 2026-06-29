package com.aurelia.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddCartItemRequest {

    @NotNull(message = "L'identifiant du produit est obligatoire")
    private Long productId;

    @Min(value = 1, message = "La quantité doit être au moins 1")
    private int quantity;
}
