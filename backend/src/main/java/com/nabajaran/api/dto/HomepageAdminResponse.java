package com.nabajaran.api.dto;

import java.time.LocalDateTime;
import java.util.List;

public record HomepageAdminResponse(
        String heroTitle,
        String heroSubtitle,
        String heroImageUrl,
        String ctaText,
        String ctaUrl,
        LocalDateTime updatedAt,
        List<HomepageAdminSectionResponse> sections
) {
}
