package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminEventPageResponse;
import com.nabajaran.api.dto.EventRequest;
import com.nabajaran.api.dto.EventResponse;
import com.nabajaran.api.enums.EventStatus;
import com.nabajaran.api.service.EventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/events")
public class AdminEventController {

    private final EventService eventService;

    public AdminEventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<AdminEventPageResponse> getEvents(
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(eventService.getAdminEvents(search, status, published, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(eventService.getAdminEvent(id));
    }

    @PostMapping
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request) {
        EventResponse event = eventService.createEvent(request);
        return ResponseEntity.created(URI.create("/api/v1/admin/events/" + event.id())).body(event);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable @Positive Long id,
            @Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<EventResponse> publishEvent(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(eventService.publishEvent(id));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<EventResponse> unpublishEvent(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(eventService.unpublishEvent(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable @Positive Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
