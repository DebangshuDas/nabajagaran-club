package com.nabajaran.api.dto;

import java.util.List;

public record AdminGalleryAlbumPageResponse(
        List<GalleryAlbumResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
