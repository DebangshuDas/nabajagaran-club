package com.nabajaran.api.dto;

import java.time.LocalDate;

public record FestivalPublicEditionSummaryResponse(
        Long id,
        Integer year,
        String theme,
        LocalDate startDate,
        LocalDate endDate,
        String venue
) {
}
