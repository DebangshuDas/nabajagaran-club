package com.nabajaran.api.dto;

import com.nabajaran.api.enums.VolunteerStatus;
import jakarta.validation.constraints.NotNull;

public record VolunteerStatusUpdateRequest(
        @NotNull(message = "Volunteer status is required.")
        VolunteerStatus status
) {
}
