package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record GalleryImageResponse(
        Long id,
        Long albumId,
        String title,
        String caption,
        String altText,
        String imageUrl,
        int displayOrder,
        boolean published,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
