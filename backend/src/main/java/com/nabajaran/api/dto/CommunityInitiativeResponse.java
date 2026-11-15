package com.nabajaran.api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CommunityInitiativeResponse(
        Long id,
        String title,
        String slug,
        String category,
        String shortDescription,
        String description,
        String imageUrl,
        LocalDate startDate,
        LocalDate endDate,
        String location,
        String status,
        boolean published,
        List<InitiativeEventResponse> relatedEvents,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
