package com.nabajaran.api.dto;

import java.util.List;

public record AdminCommunityInitiativePageResponse(
        List<CommunityInitiativeResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
