package com.nabajaran.api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record FestivalProgrammeResponse(
        Long id,
        Long festivalEditionId,
        Integer festivalYear,
        String title,
        String description,
        LocalDate programmeDate,
        LocalTime startTime,
        LocalTime endTime,
        String venue,
        Integer displayOrder,
        boolean published,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
