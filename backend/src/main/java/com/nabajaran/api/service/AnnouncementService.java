package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminAnnouncementPageResponse;
import com.nabajaran.api.dto.AnnouncementCreateRequest;
import com.nabajaran.api.dto.AnnouncementResponse;
import com.nabajaran.api.dto.AnnouncementUpdateRequest;
import com.nabajaran.api.entity.Announcement;
import com.nabajaran.api.entity.ClubInformation;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.AnnouncementRepository;
import com.nabajaran.api.repository.ClubInformationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final ClubInformationRepository clubInformationRepository;
    private final EntityManager entityManager;

    public AnnouncementService(
            AnnouncementRepository announcementRepository,
            ClubInformationRepository clubInformationRepository,
            EntityManager entityManager) {
        this.announcementRepository = announcementRepository;
        this.clubInformationRepository = clubInformationRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getPublishedAnnouncements() {
        return announcementRepository.findByPublishedTrueAndDeletedFalseOrderByPublishedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminAnnouncementPageResponse getAdminAnnouncements(
            String search,
            Boolean published,
            String audience,
            int page,
            int size,
            String sort) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = Sort.Direction.fromString(sortParts[1]);
        Specification<Announcement> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), searchPattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("content")), searchPattern, '\\')));
            }
            if (published != null) {
                predicates.add(criteriaBuilder.equal(root.get("published"), published));
            }
            if (audience != null && !audience.isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("audience")),
                        audience.trim().toLowerCase(Locale.ROOT)));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<Announcement> announcements = announcementRepository.findAll(
                specification,
                PageRequest.of(
                        page,
                        size,
                        Sort.by(direction, sortField).and(Sort.by("id").ascending())));

        return new AdminAnnouncementPageResponse(
                announcements.getContent().stream().map(this::toResponse).toList(),
                announcements.getNumber(),
                announcements.getSize(),
                announcements.getTotalElements(),
                announcements.getTotalPages());
    }

    @Transactional(readOnly = true)
    public AnnouncementResponse getAdminAnnouncement(Long id) {
        return toResponse(findActiveAnnouncement(id));
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(AnnouncementCreateRequest request) {
        ClubInformation clubInformation = clubInformationRepository.findFirstByDeletedFalseOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "An active club profile is required to create announcements."));
        Announcement announcement = new Announcement();
        announcement.setClubInformation(clubInformation);
        applyRequest(announcement, request.title(), request.content(), request.audience());
        announcement.setPublished(request.publishImmediately());
        if (request.publishImmediately()) {
            announcement.setPublishedAt(LocalDateTime.now());
        }
        return toResponse(saveAnnouncement(announcement));
    }

    @Transactional
    public AnnouncementResponse updateAnnouncement(Long id, AnnouncementUpdateRequest request) {
        Announcement announcement = findActiveAnnouncement(id);
        applyRequest(announcement, request.title(), request.content(), request.audience());
        return toResponse(saveAnnouncement(announcement));
    }

    @Transactional
    public AnnouncementResponse publishAnnouncement(Long id) {
        Announcement announcement = findActiveAnnouncement(id);
        if (!announcement.isPublished()) {
            announcement.setPublished(true);
            if (announcement.getPublishedAt() == null) {
                announcement.setPublishedAt(LocalDateTime.now());
            }
        }
        return toResponse(saveAnnouncement(announcement));
    }

    @Transactional
    public AnnouncementResponse unpublishAnnouncement(Long id) {
        Announcement announcement = findActiveAnnouncement(id);
        announcement.setPublished(false);
        return toResponse(saveAnnouncement(announcement));
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        Announcement announcement = findActiveAnnouncement(id);
        announcement.setDeleted(true);
        announcement.setDeletedAt(LocalDateTime.now());
        announcementRepository.saveAndFlush(announcement);
    }

    private Announcement findActiveAnnouncement(Long id) {
        return announcementRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found."));
    }

    private void applyRequest(Announcement announcement, String title, String content, String audience) {
        announcement.setTitle(title.trim());
        announcement.setContent(content.trim());
        announcement.setAudience(cleanOptional(audience));
    }

    private Announcement saveAnnouncement(Announcement announcement) {
        Announcement savedAnnouncement = announcementRepository.saveAndFlush(announcement);
        entityManager.refresh(savedAnnouncement);
        return savedAnnouncement;
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
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
