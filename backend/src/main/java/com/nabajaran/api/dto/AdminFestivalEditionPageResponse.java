package com.nabajaran.api.dto;

import java.util.List;

public record AdminFestivalEditionPageResponse(
        List<FestivalEditionResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
