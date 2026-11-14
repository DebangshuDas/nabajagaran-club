package com.nabajaran.api.service;

import com.nabajaran.api.dto.AnnouncementResponse;
import com.nabajaran.api.entity.Announcement;
import com.nabajaran.api.repository.AnnouncementRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getPublishedAnnouncements() {
        return announcementRepository.findByPublishedTrueAndDeletedFalseOrderByPublishedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.isPublished(),
                announcement.getPublishedAt(),
                announcement.getAudience(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt()
        );
    }
}
