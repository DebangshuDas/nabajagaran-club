package com.nabajaran.api.dto;

import java.util.List;

public record AdminFestivalPageResponse(
        List<FestivalResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
