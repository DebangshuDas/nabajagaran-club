package com.nabajaran.api.dto;

import java.util.List;

public record AdminEventPageResponse(
        List<EventResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
