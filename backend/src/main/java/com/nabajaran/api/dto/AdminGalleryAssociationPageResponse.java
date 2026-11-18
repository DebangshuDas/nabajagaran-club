package com.nabajaran.api.dto;

import java.util.List;

public record AdminGalleryAssociationPageResponse(
        List<GalleryAssociationOptionResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
