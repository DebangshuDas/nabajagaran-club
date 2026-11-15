package com.nabajaran.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnouncementCreateRequest(
        @NotBlank(message = "Title is required.")
        @Size(max = 200, message = "Title must be 200 characters or fewer.")
        String title,
        @NotBlank(message = "Content is required.")
        @Size(max = 20000, message = "Content must be 20,000 characters or fewer.")
        String content,
        @Size(max = 50, message = "Audience must be 50 characters or fewer.")
        String audience,
        boolean publishImmediately
) {
}
