package com.nabajaran.api.dto;

import java.time.LocalDateTime;

public record HealthResponse(String status, String service, LocalDateTime timestamp) {
}
