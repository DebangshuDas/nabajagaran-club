package com.nabajaran.api.dto;

import com.nabajaran.api.enums.ApprovalStatus;
import java.time.LocalDateTime;

public record MembershipApplicationAdminResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String address,
        String occupation,
        String reasonForJoining,
        String additionalMessage,
        ApprovalStatus status,
        Long memberId,
        LocalDateTime submittedAt,
        LocalDateTime reviewedAt,
        String reviewedBy,
        String internalNotes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
