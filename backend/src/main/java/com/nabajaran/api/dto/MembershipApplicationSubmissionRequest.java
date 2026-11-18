package com.nabajaran.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MembershipApplicationSubmissionRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 150, message = "Full name must be 150 characters or fewer.")
        String fullName,
        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be a valid email address.")
        @Size(max = 150, message = "Email must be 150 characters or fewer.")
        String email,
        @Size(max = 50, message = "Phone must be 50 characters or fewer.")
        String phone,
        @Size(max = 255, message = "Address must be 255 characters or fewer.")
        String address,
        @Size(max = 150, message = "Occupation must be 150 characters or fewer.")
        String occupation,
        @Size(max = 5000, message = "Reason must be 5,000 characters or fewer.")
        String reasonForJoining,
        @Size(max = 5000, message = "Additional message must be 5,000 characters or fewer.")
        String additionalMessage,
        @Size(max = 255)
        String companyWebsite
) {
}
