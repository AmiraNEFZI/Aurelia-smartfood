package com.aurelia.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PartnerProductRequest {
    @NotNull
    private Long productId;
    @NotNull @Min(0)
    private Integer stock;
    @NotNull
    private BigDecimal price;
    private Boolean isAvailable = true;
}
