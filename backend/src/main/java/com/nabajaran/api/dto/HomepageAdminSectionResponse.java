package com.nabajaran.api.dto;

import com.nabajaran.api.enums.HomepageSectionType;
import java.util.List;

public record HomepageAdminSectionResponse(
        HomepageSectionType type,
        boolean visible,
        int displayOrder,
        List<String> selectedIds,
        List<HomepageOptionResponse> options
) {
}
