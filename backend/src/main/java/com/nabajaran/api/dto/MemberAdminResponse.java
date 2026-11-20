package com.nabajaran.api.dto;

import com.nabajaran.api.enums.MembershipStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MemberAdminResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        MembershipStatus membershipStatus,
        LocalDate joinDate,
        LocalDate expiryDate,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
