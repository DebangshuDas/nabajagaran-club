package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminCommunityInitiativePageResponse;
import com.nabajaran.api.dto.CommunityInitiativeRequest;
import com.nabajaran.api.dto.CommunityInitiativeResponse;
import com.nabajaran.api.dto.InitiativeEventResponse;
import com.nabajaran.api.entity.ClubInformation;
import com.nabajaran.api.entity.CommunityInitiative;
import com.nabajaran.api.entity.Event;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.ClubInformationRepository;
import com.nabajaran.api.repository.CommunityInitiativeRepository;
import com.nabajaran.api.repository.EventRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityInitiativeService {

    private final CommunityInitiativeRepository initiativeRepository;
    private final EventRepository eventRepository;
    private final ClubInformationRepository clubInformationRepository;
    private final EntityManager entityManager;

    public CommunityInitiativeService(
            CommunityInitiativeRepository initiativeRepository,
            EventRepository eventRepository,
            ClubInformationRepository clubInformationRepository,
            EntityManager entityManager) {
        this.initiativeRepository = initiativeRepository;
        this.eventRepository = eventRepository;
        this.clubInformationRepository = clubInformationRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<CommunityInitiativeResponse> getPublishedInitiatives() {
        return initiativeRepository.findByPublishedTrueAndDeletedFalseOrderByStartDateAscIdAsc()
                .stream()
                .map(initiative -> toResponse(initiative, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminCommunityInitiativePageResponse getAdminInitiatives(
            String search,
            String category,
            String status,
            Boolean published,
            int page,
            int size) {
        Specification<CommunityInitiative> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), searchPattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("slug")), searchPattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), searchPattern, '\\'),
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("shortDescription")), searchPattern, '\\')));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("category")),
                        category.trim().toLowerCase(Locale.ROOT)));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (published != null) {
                predicates.add(criteriaBuilder.equal(root.get("published"), published));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };

        Page<CommunityInitiative> initiatives = initiativeRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("updatedAt").descending().and(Sort.by("id").descending())));

        return new AdminCommunityInitiativePageResponse(
                initiatives.getContent().stream().map(initiative -> toResponse(initiative, false)).toList(),
                initiatives.getNumber(),
                initiatives.getSize(),
                initiatives.getTotalElements(),
                initiatives.getTotalPages());
    }

    @Transactional(readOnly = true)
    public CommunityInitiativeResponse getAdminInitiative(Long id) {
        return toResponse(findActiveInitiative(id), false);
    }

    @Transactional
    public CommunityInitiativeResponse createInitiative(CommunityInitiativeRequest request) {
        ClubInformation clubInformation = clubInformationRepository.findFirstByDeletedFalseOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "An active club profile is required to create initiatives."));
        CommunityInitiative initiative = new CommunityInitiative();
        initiative.setClubInformation(clubInformation);
        applyRequest(initiative, request);
        return saveInitiative(initiative);
    }

    @Transactional
    public CommunityInitiativeResponse updateInitiative(Long id, CommunityInitiativeRequest request) {
        CommunityInitiative initiative = findActiveInitiative(id);
        applyRequest(initiative, request);
        return saveInitiative(initiative);
    }

    @Transactional
    public CommunityInitiativeResponse publishInitiative(Long id) {
        CommunityInitiative initiative = findActiveInitiative(id);
        initiative.setPublished(true);
        return saveInitiative(initiative);
    }

    @Transactional
    public CommunityInitiativeResponse unpublishInitiative(Long id) {
        CommunityInitiative initiative = findActiveInitiative(id);
        initiative.setPublished(false);
        return saveInitiative(initiative);
    }

    @Transactional
    public void deleteInitiative(Long id) {
        CommunityInitiative initiative = findActiveInitiative(id);
        initiative.setDeleted(true);
        initiative.setDeletedAt(LocalDateTime.now());
        initiativeRepository.save(initiative);
    }

    private CommunityInitiative findActiveInitiative(Long id) {
        return initiativeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Initiative not found."));
    }

    private void applyRequest(CommunityInitiative initiative, CommunityInitiativeRequest request) {
        boolean slugExists = initiative.getId() == null
                ? initiativeRepository.existsBySlug(request.slug())
                : initiativeRepository.existsBySlugAndIdNot(request.slug(), initiative.getId());
        if (slugExists) {
            throw new ConflictException("An initiative with this slug already exists.");
        }

        initiative.setTitle(request.title().trim());
        initiative.setSlug(request.slug().trim());
        initiative.setCategory(cleanOptional(request.category()));
        initiative.setShortDescription(cleanOptional(request.shortDescription()));
        initiative.setDescription(request.description().trim());
        initiative.setImageUrl(cleanOptional(request.imageUrl()));
        initiative.setStartDate(request.startDate());
        initiative.setEndDate(request.endDate());
        initiative.setLocation(cleanOptional(request.location()));
        initiative.setStatus(request.status());
        initiative.setPublished(request.published());
        initiative.setRelatedEvents(resolveRelatedEvents(request.relatedEventIds()));
    }

    private Set<Event> resolveRelatedEvents(List<Long> relatedEventIds) {
        if (relatedEventIds == null || relatedEventIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        Set<Long> uniqueIds = new LinkedHashSet<>(relatedEventIds);
        List<Event> events = eventRepository.findAllByIdInAndDeletedFalse(List.copyOf(uniqueIds));
        if (events.size() != uniqueIds.size()) {
            throw new ResourceNotFoundException("One or more selected events are unavailable.");
        }

        Map<Long, Event> eventsById = new LinkedHashMap<>();
        events.forEach(event -> eventsById.put(event.getId(), event));
        Set<Event> relatedEvents = new LinkedHashSet<>();
        uniqueIds.forEach(id -> relatedEvents.add(eventsById.get(id)));
        return relatedEvents;
    }

    private CommunityInitiativeResponse saveInitiative(CommunityInitiative initiative) {
        try {
            CommunityInitiative savedInitiative = initiativeRepository.saveAndFlush(initiative);
            entityManager.refresh(savedInitiative);
            return toResponse(savedInitiative, false);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("The initiative conflicts with existing data. Please retry the request.");
        }
    }

    private CommunityInitiativeResponse toResponse(CommunityInitiative initiative, boolean publicView) {
        List<InitiativeEventResponse> relatedEvents = initiative.getRelatedEvents().stream()
                .filter(event -> !publicView || (event.isPublished() && !event.isDeleted()))
                .sorted(Comparator.comparing(Event::getTitle))
                .map(event -> new InitiativeEventResponse(
                        event.getId(),
                        event.getTitle(),
                        event.getSlug(),
                        event.getStartAt(),
                        event.getStatus().name(),
                        event.isPublished()))
                .toList();

        return new CommunityInitiativeResponse(
                initiative.getId(),
                initiative.getTitle(),
                initiative.getSlug(),
                initiative.getCategory(),
                initiative.getShortDescription(),
                initiative.getDescription(),
                initiative.getImageUrl(),
                initiative.getStartDate(),
                initiative.getEndDate(),
                initiative.getLocation(),
                initiative.getStatus(),
                initiative.isPublished(),
                relatedEvents,
                initiative.getCreatedAt(),
                initiative.getUpdatedAt());
    }

    private String cleanOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
