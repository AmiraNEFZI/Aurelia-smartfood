package com.aurelia.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DriverRatingSummaryResponse {
    private Long   driverId;
    private String driverName;
    private Double  averageRating;     // note moyenne sur 5 (1 décimale)
    private Long    totalReviews;      // nombre total d'évaluations
    private Integer satisfactionPct;   // pourcentage (avgRating / 5 * 100)

    /** Les 5 derniers commentaires non vides — utilisés dans le dashboard livreur. */
    private List<DriverReviewResponse> recentReviews;
}
