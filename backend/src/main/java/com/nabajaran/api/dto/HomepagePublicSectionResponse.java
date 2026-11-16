package com.nabajaran.api.dto;

import com.nabajaran.api.enums.HomepageSectionType;
import java.util.List;

public record HomepagePublicSectionResponse(
        HomepageSectionType type,
        boolean visible,
        int displayOrder,
        List<HomepagePublicContentResponse> items
) {
}
