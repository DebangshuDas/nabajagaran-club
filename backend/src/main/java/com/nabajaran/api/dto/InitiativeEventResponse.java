package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record InitiativeEventResponse(
        Long id,
        String title,
        String slug,
        LocalDateTime startAt,
        String status,
        boolean published
) {
}
