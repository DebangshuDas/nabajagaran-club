package com.nabajaran.api.dto;

import com.nabajaran.api.enums.HomepageSectionType;

public record HomepagePublicContentResponse(
        HomepageSectionType type,
        String id,
        String title,
        String summary,
        String detail,
        String imageUrl,
        String url
) {
}
