package com.nabajaran.api.service;

import com.nabajaran.api.dto.EventResponse;
import com.nabajaran.api.dto.AdminEventPageResponse;
import com.nabajaran.api.dto.EventRequest;
import com.nabajaran.api.dto.GalleryImageResponse;
import com.nabajaran.api.entity.ClubInformation;
import com.nabajaran.api.entity.Event;
import com.nabajaran.api.enums.EventStatus;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.ClubInformationRepository;
import com.nabajaran.api.repository.EventRepository;
import jakarta.persistence.EntityManager;
import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import jakarta.persistence.criteria.Predicate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final ClubInformationRepository clubInformationRepository;
    private final EntityManager entityManager;
    private final GalleryService galleryService;

    public EventService(
            EventRepository eventRepository,
            ClubInformationRepository clubInformationRepository,
            EntityManager entityManager,
            GalleryService galleryService) {
        this.eventRepository = eventRepository;
        this.clubInformationRepository = clubInformationRepository;
        this.entityManager = entityManager;
        this.galleryService = galleryService;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getUpcomingEvents() {
        List<Event> events = eventRepository.findByStatusAndPublishedTrueAndDeletedFalseOrderByStartAtAsc(
                EventStatus.UPCOMING);
        Map<Long, List<GalleryImageResponse>> galleryByEvent =
                galleryService.getPublishedEventImages(events.stream().map(Event::getId).toList());
        return events
                .stream()
                .map(event -> toResponse(event, galleryByEvent.getOrDefault(event.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminEventPageResponse getAdminEvents(
            String search,
            EventStatus status,
            Boolean published,
            int page,
            int size) {
        Specification<Event> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.<Boolean>get("deleted")));

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        searchPattern,
                        '\\'));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (published != null) {
                predicates.add(criteriaBuilder.equal(root.get("published"), published));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<Event> events = eventRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("startAt").ascending().and(Sort.by("id").ascending())));

        return new AdminEventPageResponse(
                events.getContent().stream().map(this::toResponse).toList(),
                events.getNumber(),
                events.getSize(),
                events.getTotalElements(),
                events.getTotalPages());
    }

    @Transactional(readOnly = true)
    public EventResponse getAdminEvent(Long id) {
        return toResponse(findActiveEvent(id));
    }

    @Transactional
    public EventResponse createEvent(EventRequest request) {
        ClubInformation clubInformation = clubInformationRepository.findFirstByDeletedFalseOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("An active club profile is required to create events."));
        Event event = new Event();
        event.setClubInformation(clubInformation);
        applyRequest(event, request);
        return saveEvent(event);
    }

    @Transactional
    public EventResponse updateEvent(Long id, EventRequest request) {
        Event event = findActiveEvent(id);
        applyRequest(event, request);
        return saveEvent(event);
    }

    @Transactional
    public EventResponse publishEvent(Long id) {
        Event event = findActiveEvent(id);
        event.setPublished(true);
        return saveEvent(event);
    }

    @Transactional
    public EventResponse unpublishEvent(Long id) {
        Event event = findActiveEvent(id);
        event.setPublished(false);
        return saveEvent(event);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = findActiveEvent(id);
        event.setDeleted(true);
        event.setDeletedAt(LocalDateTime.now());
        eventRepository.save(event);
    }

    private Event findActiveEvent(Long id) {
        return eventRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found."));
    }

    private void applyRequest(Event event, EventRequest request) {
        event.setTitle(request.title().trim());
        event.setSlug(createUniqueSlug(request.title(), event.getId()));
        event.setShortDescription(cleanOptional(request.shortDescription()));
        event.setDescription(request.description().trim());
        event.setEventType(request.eventType().trim());
        event.setStatus(request.status());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setVenue(cleanOptional(request.venue()));
        event.setAddress(cleanOptional(request.address()));
        event.setCapacity(request.capacity());
        event.setImageUrl(cleanOptional(request.imageUrl()));
        event.setPublished(request.published());
    }

    private EventResponse saveEvent(Event event) {
        try {
            Event savedEvent = eventRepository.saveAndFlush(event);
            entityManager.refresh(savedEvent);
            return toResponse(savedEvent);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("The event conflicts with existing data. Please retry the request.");
        }
    }

    private String createUniqueSlug(String title, Long eventId) {
        String slug = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (slug.isBlank()) {
            slug = "event";
        }
        if (slug.length() > 200) {
            slug = slug.substring(0, 200).replaceAll("-+$", "");
        }

        String candidate = slug;
        int suffix = 2;
        while (slugExists(candidate, eventId)) {
            String suffixText = "-" + suffix++;
            int prefixLength = Math.max(1, 200 - suffixText.length());
            String prefix = slug.substring(0, Math.min(slug.length(), prefixLength))
                    .replaceAll("-+$", "");
            candidate = prefix + suffixText;
        }
        return candidate;
    }

    private boolean slugExists(String slug, Long eventId) {
        return eventId == null
                ? eventRepository.existsBySlug(slug)
                : eventRepository.existsBySlugAndIdNot(slug, eventId);
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private String cleanOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private EventResponse toResponse(Event event) {
        return toResponse(event, List.of());
    }

    private EventResponse toResponse(Event event, List<GalleryImageResponse> galleryImages) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getSlug(),
                event.getDescription(),
                event.getShortDescription(),
                event.getEventType(),
                event.getStatus().name(),
                event.getStartAt(),
                event.getEndAt(),
                event.getVenue(),
                event.getAddress(),
                event.isPublished(),
                event.getCapacity(),
                event.getImageUrl(),
                galleryImages,
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
