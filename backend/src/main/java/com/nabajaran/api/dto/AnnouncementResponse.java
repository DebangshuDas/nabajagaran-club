package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        String title,
        String content,
        boolean published,
        LocalDateTime publishedAt,
        String audience,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
