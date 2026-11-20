package com.nabajaran.api.dto;

import com.nabajaran.api.enums.VolunteerStatus;
import java.time.LocalDateTime;

public record VolunteerAdminResponse(
        Long id,
        Long registrationId,
        Long memberId,
        String fullName,
        String email,
        String phone,
        String preferredRoles,
        String availability,
        VolunteerStatus status,
        LocalDateTime activatedAt,
        LocalDateTime deactivatedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
