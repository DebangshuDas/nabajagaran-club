package com.nabajaran.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GalleryImageOrderRequest(
        @NotEmpty(message = "At least one image ID is required.")
        @Size(max = 500, message = "No more than 500 images can be reordered at once.")
        List<@NotNull @Positive Long> imageIds
) {
}
