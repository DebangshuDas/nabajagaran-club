package com.nabajaran.api.dto;

import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @Size(max = 5000, message = "Internal notes must be 5,000 characters or fewer.")
        String internalNotes
) {
}
