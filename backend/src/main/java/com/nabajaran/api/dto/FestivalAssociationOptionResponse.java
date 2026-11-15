package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record FestivalAssociationOptionResponse(
        Long id,
        String label,
        String detail,
        String imageUrl,
        LocalDateTime startAt,
        String status,
        boolean published
) {
}
