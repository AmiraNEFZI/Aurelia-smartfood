package com.aurelia.backend.dto.response;

import com.aurelia.backend.entity.DriverComplaint.ComplaintCategory;
import com.aurelia.backend.entity.DriverComplaint.ComplaintStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class DriverComplaintResponse {
    private Long id;
    private Long orderId;
    private Long driverId;
    private String driverName;
    private String clientName;
    private ComplaintCategory category;
    private String categoryLabel;
    private String description;
    private ComplaintStatus status;
    private LocalDateTime createdAt;
}
