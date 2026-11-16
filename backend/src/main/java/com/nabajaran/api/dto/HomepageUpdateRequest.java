package com.nabajaran.api.dto;

import com.nabajaran.api.enums.HomepageSectionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record HomepageUpdateRequest(
        @NotBlank @Size(max = 200) String heroTitle,
        @Size(max = 500) String heroSubtitle,
        @Size(max = 255) String heroImageUrl,
        @Size(max = 100) String ctaText,
        @Size(max = 255) String ctaUrl,
        @NotNull @Size(min = 6, max = 6) List<@Valid HomepageSectionUpdateRequest> sections
) {
    public record HomepageSectionUpdateRequest(
            @NotNull HomepageSectionType type,
            boolean visible,
            @NotNull Integer displayOrder,
            @NotNull @Size(max = 100) List<@NotBlank @Size(max = 255) String> selectedIds
    ) {
    }
}
