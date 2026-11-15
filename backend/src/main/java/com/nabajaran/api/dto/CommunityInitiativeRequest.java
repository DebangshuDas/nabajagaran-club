package com.nabajaran.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;

public record CommunityInitiativeRequest(
        @NotBlank(message = "Title is required.")
        @Size(max = 200, message = "Title must be 200 characters or fewer.")
        String title,
        @NotBlank(message = "Slug is required.")
        @Size(max = 255, message = "Slug must be 255 characters or fewer.")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must use lowercase letters, numbers, and hyphens.")
        String slug,
        @Size(max = 100, message = "Category must be 100 characters or fewer.")
        String category,
        @Size(max = 500, message = "Short description must be 500 characters or fewer.")
        String shortDescription,
        @NotBlank(message = "Description is required.")
        @Size(max = 20000, message = "Description must be 20,000 characters or fewer.")
        String description,
        @Size(max = 255, message = "Cover image URL must be 255 characters or fewer.")
        String imageUrl,
        LocalDate startDate,
        LocalDate endDate,
        @Size(max = 255, message = "Location must be 255 characters or fewer.")
        String location,
        @NotBlank(message = "Status is required.")
        @Pattern(regexp = "PLANNED|ACTIVE|COMPLETED", message = "Status must be PLANNED, ACTIVE, or COMPLETED.")
        String status,
        boolean published,
        @Size(max = 100, message = "No more than 100 related events may be selected.")
        List<@NotNull Long> relatedEventIds
) {
    @AssertTrue(message = "End date cannot be before the start date.")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }

    @AssertTrue(message = "Cover image URL must be a valid HTTP or HTTPS URL.")
    public boolean isImageUrlValid() {
        if (imageUrl == null || imageUrl.isBlank()) {
            return true;
        }
        try {
            URI uri = URI.create(imageUrl.trim());
            return uri.isAbsolute()
                    && uri.getHost() != null
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
