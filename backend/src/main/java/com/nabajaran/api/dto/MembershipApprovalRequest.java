package com.nabajaran.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MembershipApprovalRequest(
        @NotBlank(message = "First name is required.")
        @Size(max = 100, message = "First name must be 100 characters or fewer.")
        String firstName,
        @NotBlank(message = "Last name is required.")
        @Size(max = 100, message = "Last name must be 100 characters or fewer.")
        String lastName,
        @Size(max = 5000, message = "Internal notes must be 5,000 characters or fewer.")
        String internalNotes
) {
}
