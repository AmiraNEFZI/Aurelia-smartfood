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
        LocalDateTime startOfDay  = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        List<Order> allOrders = orderRepository.findAll();

        // ── Revenus : TOUTES les commandes sauf ANNULEE ──────────────────────
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() != StatutCommande.ANNULEE)
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueThisMonth = allOrders.stream()
                .filter(o -> o.getStatus() != StatutCommande.ANNULEE
                          && o.getOrderDate() != null
                          && o.getOrderDate().isAfter(startOfMonth))
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueToday = allOrders.stream()
                .filter(o -> o.getStatus() != StatutCommande.ANNULEE
                          && o.getOrderDate() != null
                          && o.getOrderDate().isAfter(startOfDay))
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Comptages ─────────────────────────────────────────────────────────
        long totalOrders = allOrders.size();
        long ordersToday = allOrders.stream()
                .filter(o -> o.getOrderDate() != null && o.getOrderDate().isAfter(startOfDay))
                .count();
        long ordersThisMonth = allOrders.stream()
                .filter(o -> o.getOrderDate() != null && o.getOrderDate().isAfter(startOfMonth))
                .count();
        long deliveriesToday = allOrders.stream()
                .filter(o -> o.getOrderDate() != null
                          && o.getOrderDate().isAfter(startOfDay)
                          && o.getStatus() == StatutCommande.LIVREE)
                .count();

        BigDecimal averageOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // ── Utilisateurs ──────────────────────────────────────────────────────
        long totalClients = userRepository.findByRole(Role.CLIENT).size();
        long totalDrivers = userRepository.findByRole(Role.LIVREUR).size();
        long activeDrivers = userRepository.findLivreursParStatut(StatutLivreur.DISPONIBLE).size()
                           + userRepository.findLivreursParStatut(StatutLivreur.OCCUPE).size();

        // ── Statuts commandes ─────────────────────────────────────────────────
        long ordersEnAttente      = countByStatus(allOrders, StatutCommande.EN_ATTENTE);
        long ordersPriseEnCharge  = countByStatus(allOrders, StatutCommande.PRISE_EN_CHARGE);
        long ordersEnLivraison    = countByStatus(allOrders, StatutCommande.EN_LIVRAISON);
        long ordersLivrees        = countByStatus(allOrders, StatutCommande.LIVREE);
        long ordersAnnulees       = countByStatus(allOrders, StatutCommande.ANNULEE);

        // ── Revenus journaliers semaine courante ──────────────────────────────
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
        LocalDate today  = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        String[] dayNames = {"Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"};

        BigDecimal[] dailyAmounts = new BigDecimal[7];
        long[]       dailyCounts  = new long[7];
        BigDecimal   weeklyTotal  = BigDecimal.ZERO;

        for (int i = 0; i < 7; i++) {
            LocalDate     day   = monday.plusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end   = day.plusDays(1).atStartOfDay();

            // Tous les jours (y compris jours futurs = 0)
            BigDecimal dayRevenue = allOrders.stream()
                    .filter(o -> o.getOrderDate() != null
                              && o.getStatus() != StatutCommande.ANNULEE
                              && !o.getOrderDate().isBefore(start)
                              && o.getOrderDate().isBefore(end))
                    .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long dayCount = allOrders.stream()
                    .filter(o -> o.getOrderDate() != null
                              && !o.getOrderDate().isBefore(start)
                              && o.getOrderDate().isBefore(end))
                    .count();

            dailyAmounts[i] = dayRevenue;
            dailyCounts[i]  = dayCount;
            weeklyTotal = weeklyTotal.add(dayRevenue);
        }

        List<AdminStatsResponse.DailyRevenue> result = new ArrayList<>();
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
