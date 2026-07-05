package com.aurelia.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data @Builder
public class PartnerProductResponse {
    private Long id;
    private Long partnerId;
    private String partnerName;
    private Long productId;
    private String productName;
    private String productImage;
    private Integer stock;
    private BigDecimal price;
    private Boolean isAvailable;
}
