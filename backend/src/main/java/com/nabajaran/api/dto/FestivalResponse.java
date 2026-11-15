package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record FestivalResponse(
        Long id,
        String name,
        String slug,
        String description,
        String history,
        String coverImageUrl,
        boolean published,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
