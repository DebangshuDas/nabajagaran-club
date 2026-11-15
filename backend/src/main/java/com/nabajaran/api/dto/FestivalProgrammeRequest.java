package com.nabajaran.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record FestivalProgrammeRequest(
        @NotBlank(message = "Programme title is required.")
        @Size(max = 200, message = "Programme title must be 200 characters or fewer.")
        String title,
        @Size(max = 20000, message = "Programme description must be 20,000 characters or fewer.")
        String description,
        @NotNull(message = "Programme date is required.")
        LocalDate programmeDate,
        @NotNull(message = "Programme start time is required.")
        LocalTime startTime,
        LocalTime endTime,
        @Size(max = 255, message = "Programme venue must be 255 characters or fewer.")
        String venue,
        @NotNull(message = "Display order is required.")
        @Min(value = 0, message = "Display order cannot be negative.")
        Integer displayOrder,
        boolean published
) {
}
