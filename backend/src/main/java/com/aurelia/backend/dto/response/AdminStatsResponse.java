package com.aurelia.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    // Dashboard KPIs
    private BigDecimal totalRevenue;
    private BigDecimal revenueThisMonth;
    private BigDecimal revenueToday;
    private long totalOrders;
    private long ordersToday;
    private long ordersThisMonth;
    private long totalClients;
    private long totalDrivers;
    private long activeDrivers;
    private long deliveriesToday;
    private BigDecimal averageOrderValue;

    // Daily revenue for the current week (Mon-Sun)
    private List<DailyRevenue> weeklyRevenue;

    // Orders by status
    private long ordersEnAttente;
    private long ordersPriseEnCharge;
    private long ordersEnLivraison;
    private long ordersLivrees;
    private long ordersAnnulees;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenue {
        private String day;        // "Lun", "Mar", etc.
        private BigDecimal amount;
        private long orderCount;
        private int percentage;    // % of weekly total
    }
}
