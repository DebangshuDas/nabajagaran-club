package com.nabajaran.api.dto;

public record FestivalPublicSummaryResponse(
        Long id,
        String name,
        String slug,
        String description,
        String coverImageUrl,
        FestivalPublicEditionSummaryResponse latestEdition
) {
}
