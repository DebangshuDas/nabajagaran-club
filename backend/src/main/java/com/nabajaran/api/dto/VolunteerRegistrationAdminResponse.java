package com.nabajaran.api.dto;

import com.nabajaran.api.enums.ApprovalStatus;
import java.time.LocalDateTime;

public record VolunteerRegistrationAdminResponse(
        Long id,
        Long memberId,
        String fullName,
        String email,
        String phone,
        String preferredRoles,
        String availability,
        String motivation,
        ApprovalStatus status,
        LocalDateTime reviewedAt,
        String reviewedBy,
        String internalNotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
