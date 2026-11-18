package com.nabajaran.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record GalleryImageMetadataRequest(
        @NotNull(message = "Album ID is required.")
        @Positive(message = "Album ID must be positive.")
        Long albumId,
        @Size(max = 200, message = "Image title must be at most 200 characters.")
        String title,
        @Size(max = 10000, message = "Image caption must be at most 10,000 characters.")
        String caption,
        @Size(max = 255, message = "Alternative text must be at most 255 characters.")
        String altText,
        @Min(value = 0, message = "Display order cannot be negative.")
        int displayOrder,
        boolean published
) {
}
