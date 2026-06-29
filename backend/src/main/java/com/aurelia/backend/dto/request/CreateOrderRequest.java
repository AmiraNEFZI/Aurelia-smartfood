package com.aurelia.backend.dto.request;

import com.aurelia.backend.enums.MethodePaiement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "L'adresse de livraison est obligatoire")
    private String address;

    @NotNull(message = "La méthode de paiement est obligatoire")
    private MethodePaiement paymentMethod;
}
