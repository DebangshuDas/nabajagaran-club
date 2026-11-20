package com.nabajaran.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VolunteerRegistrationSubmissionRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 150, message = "Full name must be 150 characters or fewer.")
        String fullName,
        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be a valid email address.")
        @Size(max = 150, message = "Email must be 150 characters or fewer.")
        String email,
        @Size(max = 50, message = "Phone must be 50 characters or fewer.")
        String phone,
        @Size(max = 5000, message = "Preferred roles must be 5,000 characters or fewer.")
        String preferredRoles,
        @Size(max = 5000, message = "Availability must be 5,000 characters or fewer.")
        String availability,
        @Size(max = 5000, message = "Motivation must be 5,000 characters or fewer.")
        String motivation,
        @Size(max = 255)
        String companyWebsite
) {
}
