package com.nabajaran.api.dto;

import java.util.List;

public record AdminAnnouncementPageResponse(
        List<AnnouncementResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
