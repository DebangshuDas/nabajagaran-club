package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminAnnouncementPageResponse;
import com.nabajaran.api.dto.AnnouncementCreateRequest;
import com.nabajaran.api.dto.AnnouncementResponse;
import com.nabajaran.api.dto.AnnouncementUpdateRequest;
import com.nabajaran.api.service.AnnouncementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
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
@RequestMapping("/api/v1/admin/announcements")
public class AdminAnnouncementController {

    private final AnnouncementService announcementService;

    public AdminAnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    public ResponseEntity<AdminAnnouncementPageResponse> getAnnouncements(
            @RequestParam(defaultValue = "") @Size(max = 20000) String search,
            @RequestParam(required = false) Boolean published,
            @RequestParam(required = false) @Size(max = 50) String audience,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "createdAt,desc")
            @Pattern(regexp = "(createdAt|publishedAt),(asc|desc)") String sort) {
        return ResponseEntity.ok(announcementService.getAdminAnnouncements(
                search, published, audience, page, size, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> getAnnouncement(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(announcementService.getAdminAnnouncement(id));
    }

    @PostMapping
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @Valid @RequestBody AnnouncementCreateRequest request) {
        AnnouncementResponse announcement = announcementService.createAnnouncement(request);
        return ResponseEntity
                .created(URI.create("/api/v1/admin/announcements/" + announcement.id()))
                .body(announcement);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(
            @PathVariable @Positive Long id,
            @Valid @RequestBody AnnouncementUpdateRequest request) {
        return ResponseEntity.ok(announcementService.updateAnnouncement(id, request));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<AnnouncementResponse> publishAnnouncement(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(announcementService.publishAnnouncement(id));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<AnnouncementResponse> unpublishAnnouncement(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(announcementService.unpublishAnnouncement(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable @Positive Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.noContent().build();
    }
}
