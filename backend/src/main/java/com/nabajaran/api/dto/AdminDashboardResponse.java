package com.nabajaran.api.dto;

import java.util.List;

public record AdminDashboardResponse(
        int upcomingEvents,
        int publishedAnnouncements,
        int approvedBusinesses,
        List<EventResponse> events,
        List<AnnouncementResponse> announcements) {
}
