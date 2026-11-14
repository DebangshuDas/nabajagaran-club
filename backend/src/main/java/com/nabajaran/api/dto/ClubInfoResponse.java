package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record ClubInfoResponse(
        Long id,
        String clubName,
        String tagline,
        String description,
        String mission,
        Integer foundedYear,
        String address,
        String city,
        String state,
        String country,
        String postalCode,
        String email,
        String phone,
        String website,
        String facebookUrl,
        String instagramUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
