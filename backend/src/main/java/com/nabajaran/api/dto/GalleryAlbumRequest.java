package com.nabajaran.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record GalleryAlbumRequest(
        @NotBlank(message = "Album title is required.")
        @Size(max = 200, message = "Album title must be at most 200 characters.")
        String title,
        @Size(max = 10000, message = "Album description must be at most 10,000 characters.")
        String description,
        @Size(max = 50, message = "Album category must be at most 50 characters.")
        String category,
        @Positive(message = "Cover image ID must be positive.")
        Long coverImageId,
        @Positive(message = "Event ID must be positive.")
        Long eventId,
        @Positive(message = "Initiative ID must be positive.")
        Long initiativeId,
        @Positive(message = "Festival edition ID must be positive.")
        Long festivalEditionId,
        boolean published
) {
    @AssertTrue(message = "An album can be associated with at most one event, initiative, or festival edition.")
    public boolean hasAtMostOneAssociation() {
        return (eventId == null ? 0 : 1)
                + (initiativeId == null ? 0 : 1)
                + (festivalEditionId == null ? 0 : 1) <= 1;
    }
}
