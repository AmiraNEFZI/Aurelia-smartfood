package com.aurelia.backend.dto.response;

import com.aurelia.backend.enums.MethodePaiement;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.enums.StatutPaiement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long userId;
    private String clientName;
    private Long driverId;
    private String driverName;
    private String address;
    private MethodePaiement paymentMethod;
    private StatutPaiement paymentStatus;
    private StatutCommande status;
    private BigDecimal totalAmount;
    private LocalDateTime orderDate;
    private List<OrderItemResponse> items;
}
