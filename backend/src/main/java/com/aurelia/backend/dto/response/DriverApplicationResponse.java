package com.aurelia.backend.dto.response;

import com.aurelia.backend.enums.DriverApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverApplicationResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String documentUrl;
    private String rejectReason;
    private DriverApplicationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String temporaryPassword;
}
