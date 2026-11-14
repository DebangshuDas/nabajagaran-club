package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminDashboardResponse;
import com.nabajaran.api.service.AnnouncementService;
import com.nabajaran.api.service.BusinessService;
import com.nabajaran.api.service.EventService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminDashboardController {

    private final EventService eventService;
    private final AnnouncementService announcementService;
    private final BusinessService businessService;

    public AdminDashboardController(
            EventService eventService,
            AnnouncementService announcementService,
            BusinessService businessService) {
        this.eventService = eventService;
        this.announcementService = announcementService;
        this.businessService = businessService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        var upcomingEvents = eventService.getUpcomingEvents();
        var publishedAnnouncements = announcementService.getPublishedAnnouncements();
        var approvedBusinesses = businessService.getApprovedBusinesses();

        return ResponseEntity.ok(new AdminDashboardResponse(
                upcomingEvents.size(),
                publishedAnnouncements.size(),
                approvedBusinesses.size(),
                upcomingEvents.stream().limit(5).toList(),
                publishedAnnouncements.stream().limit(4).toList()));
    }
}
