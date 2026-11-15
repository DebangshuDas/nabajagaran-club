package com.nabajaran.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;

public record FestivalRequest(
        @NotBlank(message = "Festival name is required.")
        @Size(max = 150, message = "Festival name must be 150 characters or fewer.")
        String name,
        @NotBlank(message = "Festival slug is required.")
        @Size(max = 150, message = "Festival slug must be 150 characters or fewer.")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must use lowercase letters, numbers, and hyphens.")
        String slug,
        @Size(max = 20000, message = "Description must be 20,000 characters or fewer.")
        String description,
        @Size(max = 50000, message = "History must be 50,000 characters or fewer.")
        String history,
        @Size(max = 255, message = "Cover image URL must be 255 characters or fewer.")
        String coverImageUrl,
        boolean published
) {
    @AssertTrue(message = "Cover image URL must be a valid HTTP or HTTPS URL.")
    public boolean isCoverImageUrlValid() {
        if (coverImageUrl == null || coverImageUrl.isBlank()) {
            return true;
        }
        try {
            URI uri = URI.create(coverImageUrl.trim());
            return uri.isAbsolute()
                    && uri.getHost() != null
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
