package com.aurelia.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DriverReviewResponse {
    private Long id;
    private Long orderId;
    private Long driverId;
    private String driverName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
