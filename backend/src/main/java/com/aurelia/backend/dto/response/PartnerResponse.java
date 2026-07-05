package com.aurelia.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data @Builder
public class PartnerResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String contactPerson;
    private String website;
    private String description;
    private Boolean isActive;
    private List<PartnerProductResponse> products;
    private int totalProducts;
    private int totalStock;
}
