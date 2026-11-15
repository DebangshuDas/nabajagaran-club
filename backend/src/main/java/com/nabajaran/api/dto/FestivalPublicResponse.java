package com.nabajaran.api.dto;

import java.util.List;

public record FestivalPublicResponse(
        Long id,
        String name,
        String slug,
        String description,
        String history,
        String coverImageUrl,
        List<FestivalEditionResponse> editions
) {
}
