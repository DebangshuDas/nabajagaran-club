package com.nabajaran.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record FestivalProgrammeReorderRequest(
        @NotNull(message = "Programme date is required.")
        LocalDate programmeDate,
        @NotEmpty(message = "At least one programme is required to reorder.")
        @Size(max = 500, message = "No more than 500 programmes can be reordered at once.")
        List<@NotNull @Positive Long> programmeIds
) {
}
