package com.aurelia.backend.service;

import com.aurelia.backend.dto.response.AdminStatsResponse;
import com.aurelia.backend.entity.Order;
import com.aurelia.backend.enums.Role;
import com.aurelia.backend.enums.StatutCommande;
import com.aurelia.backend.enums.StatutLivreur;
import com.aurelia.backend.repository.OrderRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AdminStatsResponse getStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        // All orders
        List<Order> allOrders = orderRepository.findAll();

        // Revenue calculations (only LIVREE or PRISE_EN_CHARGE = confirmed)
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() == StatutCommande.LIVREE
                          || o.getStatus() == StatutCommande.EN_LIVRAISON
                          || o.getStatus() == StatutCommande.PRISE_EN_CHARGE)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueThisMonth = allOrders.stream()
                .filter(o -> o.getOrderDate().isAfter(startOfMonth)
                          && (o.getStatus() == StatutCommande.LIVREE
                              || o.getStatus() == StatutCommande.EN_LIVRAISON
                              || o.getStatus() == StatutCommande.PRISE_EN_CHARGE))
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueToday = allOrders.stream()
                .filter(o -> o.getOrderDate().isAfter(startOfDay)
                          && (o.getStatus() == StatutCommande.LIVREE
                              || o.getStatus() == StatutCommande.EN_LIVRAISON
                              || o.getStatus() == StatutCommande.PRISE_EN_CHARGE))
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = allOrders.size();
        long ordersToday = allOrders.stream()
                .filter(o -> o.getOrderDate().isAfter(startOfDay)).count();
        long ordersThisMonth = allOrders.stream()
                .filter(o -> o.getOrderDate().isAfter(startOfMonth)).count();

        long deliveriesToday = allOrders.stream()
                .filter(o -> o.getOrderDate().isAfter(startOfDay)
                          && o.getStatus() == StatutCommande.LIVREE).count();

        BigDecimal averageOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Users
        long totalClients = userRepository.findByRole(Role.CLIENT).size();
        long totalDrivers = userRepository.findByRole(Role.LIVREUR).size();
        long activeDrivers = userRepository.findLivreursParStatut(StatutLivreur.DISPONIBLE).size()
                           + userRepository.findLivreursParStatut(StatutLivreur.OCCUPE).size();

        // Orders by status
        long ordersEnAttente = countByStatus(allOrders, StatutCommande.EN_ATTENTE);
        long ordersPriseEnCharge = countByStatus(allOrders, StatutCommande.PRISE_EN_CHARGE);
        long ordersEnLivraison = countByStatus(allOrders, StatutCommande.EN_LIVRAISON);
        long ordersLivrees = countByStatus(allOrders, StatutCommande.LIVREE);
        long ordersAnnulees = countByStatus(allOrders, StatutCommande.ANNULEE);

        // Weekly revenue (current week Mon-Sun)
        List<AdminStatsResponse.DailyRevenue> weeklyRevenue = buildWeeklyRevenue(allOrders);

        return AdminStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .revenueThisMonth(revenueThisMonth)
                .revenueToday(revenueToday)
                .totalOrders(totalOrders)
                .ordersToday(ordersToday)
                .ordersThisMonth(ordersThisMonth)
                .totalClients(totalClients)
                .totalDrivers(totalDrivers)
                .activeDrivers(activeDrivers)
                .deliveriesToday(deliveriesToday)
                .averageOrderValue(averageOrderValue)
                .weeklyRevenue(weeklyRevenue)
                .ordersEnAttente(ordersEnAttente)
                .ordersPriseEnCharge(ordersPriseEnCharge)
                .ordersEnLivraison(ordersEnLivraison)
                .ordersLivrees(ordersLivrees)
                .ordersAnnulees(ordersAnnulees)
                .build();
    }

    private long countByStatus(List<Order> orders, StatutCommande status) {
        return orders.stream().filter(o -> o.getStatus() == status).count();
    }

    private List<AdminStatsResponse.DailyRevenue> buildWeeklyRevenue(List<Order> allOrders) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);

        String[] dayNames = {"Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"};
        List<AdminStatsResponse.DailyRevenue> result = new ArrayList<>();

        BigDecimal weeklyTotal = BigDecimal.ZERO;
        BigDecimal[] dailyAmounts = new BigDecimal[7];
        long[] dailyCounts = new long[7];

        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end = day.plusDays(1).atStartOfDay();

            BigDecimal dayRevenue = allOrders.stream()
                    .filter(o -> o.getOrderDate().isAfter(start)
                              && o.getOrderDate().isBefore(end)
                              && (o.getStatus() == StatutCommande.LIVREE
                                  || o.getStatus() == StatutCommande.EN_LIVRAISON
                                  || o.getStatus() == StatutCommande.PRISE_EN_CHARGE))
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long dayCount = allOrders.stream()
                    .filter(o -> o.getOrderDate().isAfter(start)
                              && o.getOrderDate().isBefore(end))
                    .count();

            dailyAmounts[i] = dayRevenue;
            dailyCounts[i] = dayCount;
            weeklyTotal = weeklyTotal.add(dayRevenue);
        }

        for (int i = 0; i < 7; i++) {
            int pct = 0;
            if (weeklyTotal.compareTo(BigDecimal.ZERO) > 0) {
                pct = dailyAmounts[i].multiply(BigDecimal.valueOf(100))
                        .divide(weeklyTotal, 0, RoundingMode.HALF_UP).intValue();
            }
            result.add(AdminStatsResponse.DailyRevenue.builder()
                    .day(dayNames[i])
                    .amount(dailyAmounts[i])
                    .orderCount(dailyCounts[i])
                    .percentage(pct)
                    .build());
        }
        return result;
    }
}
