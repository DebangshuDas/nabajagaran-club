package com.nabajaran.api.dto;

import java.time.LocalDateTime;
import java.util.List;

public record GalleryAlbumResponse(
        Long id,
        String title,
        String description,
        String category,
        String coverImageUrl,
        Long eventId,
        String eventTitle,
        Long initiativeId,
        String initiativeTitle,
        Long festivalEditionId,
        String festivalName,
        Integer editionYear,
        boolean published,
        int imageCount,
        List<GalleryImageResponse> images,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
