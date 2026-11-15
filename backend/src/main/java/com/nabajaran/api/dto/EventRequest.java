package com.nabajaran.api.dto;

import com.nabajaran.api.enums.EventStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record EventRequest(
        @NotBlank(message = "Title is required.")
        @Size(max = 200, message = "Title must be 200 characters or fewer.")
        String title,
        @Size(max = 500, message = "Short description must be 500 characters or fewer.")
        String shortDescription,
        @NotBlank(message = "Description is required.")
        String description,
        @NotBlank(message = "Event type is required.")
        @Size(max = 50, message = "Event type must be 50 characters or fewer.")
        String eventType,
        @NotNull(message = "Status is required.")
        EventStatus status,
        @NotNull(message = "Start date and time are required.")
        LocalDateTime startAt,
        LocalDateTime endAt,
        @Size(max = 255, message = "Venue must be 255 characters or fewer.")
        String venue,
        @Size(max = 255, message = "Address must be 255 characters or fewer.")
        String address,
        @PositiveOrZero(message = "Capacity must be zero or greater.")
        Integer capacity,
        @Size(max = 255, message = "Image URL must be 255 characters or fewer.")
        String imageUrl,
        boolean published
) {
    @AssertTrue(message = "End date and time must be after the start date and time.")
    public boolean isEndAtAfterStartAt() {
        return endAt == null || startAt == null || endAt.isAfter(startAt);
    }
}
