package com.nabajaran.api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record FestivalEditionResponse(
        Long id,
        Long festivalId,
        String festivalName,
        Integer year,
        String theme,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String venue,
        String address,
        boolean published,
        List<FestivalAssociationOptionResponse> events,
        List<FestivalAssociationOptionResponse> galleryImages,
        List<FestivalAssociationOptionResponse> sponsors,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
