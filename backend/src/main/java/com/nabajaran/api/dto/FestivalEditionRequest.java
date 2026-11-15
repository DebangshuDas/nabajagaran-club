package com.nabajaran.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record FestivalEditionRequest(
        @NotNull(message = "Edition year is required.")
        @Min(value = 1, message = "Edition year must be between 1 and 9999.")
        @Max(value = 9999, message = "Edition year must be between 1 and 9999.")
        Integer year,
        @Size(max = 200, message = "Theme must be 200 characters or fewer.")
        String theme,
        @Size(max = 20000, message = "Description must be 20,000 characters or fewer.")
        String description,
        LocalDate startDate,
        LocalDate endDate,
        @Size(max = 255, message = "Venue must be 255 characters or fewer.")
        String venue,
        @Size(max = 255, message = "Address must be 255 characters or fewer.")
        String address,
        boolean published,
        @Size(max = 100, message = "No more than 100 events may be associated.")
        List<@NotNull @Positive Long> eventIds,
        @Size(max = 100, message = "No more than 100 gallery images may be associated.")
        List<@NotNull @Positive Long> galleryImageIds,
        @Size(max = 100, message = "No more than 100 sponsors may be associated.")
        List<@NotNull @Positive Long> sponsorIds
) {
    @AssertTrue(message = "End date cannot be before the start date.")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
