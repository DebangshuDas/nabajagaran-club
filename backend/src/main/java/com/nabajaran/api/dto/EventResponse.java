package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record EventResponse(
        Long id,
        String title,
        String slug,
        String description,
        String shortDescription,
        String eventType,
        String status,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String venue,
        String address,
        boolean published,
        Integer capacity,
        String imageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
