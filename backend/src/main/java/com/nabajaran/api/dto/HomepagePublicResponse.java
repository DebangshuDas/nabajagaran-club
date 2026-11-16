package com.nabajaran.api.dto;

import java.util.List;

public record HomepagePublicResponse(
        String heroTitle,
        String heroSubtitle,
        String heroImageUrl,
        String ctaText,
        String ctaUrl,
        List<HomepagePublicSectionResponse> sections
) {
}
