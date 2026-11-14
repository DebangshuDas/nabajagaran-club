package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AnnouncementResponse;
import com.nabajaran.api.service.AnnouncementService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping("/announcements/published")
    public ResponseEntity<List<AnnouncementResponse>> getPublishedAnnouncements() {
        return ResponseEntity.ok(announcementService.getPublishedAnnouncements());
    }
}
