package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record BusinessResponse(
        Long id,
        String name,
        String slug,
        String categoryName,
        String description,
        String website,
        String email,
        String phone,
        String address,
        String city,
        String state,
        String country,
        String postalCode,
        String approvalStatus,
        boolean featured,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
