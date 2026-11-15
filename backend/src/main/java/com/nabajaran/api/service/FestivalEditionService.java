package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminFestivalEditionPageResponse;
import com.nabajaran.api.dto.FestivalAssociationOptionResponse;
import com.nabajaran.api.dto.FestivalEditionRequest;
import com.nabajaran.api.dto.FestivalEditionResponse;
import com.nabajaran.api.dto.FestivalProgrammeResponse;
import com.nabajaran.api.entity.Event;
import com.nabajaran.api.entity.Festival;
import com.nabajaran.api.entity.FestivalEdition;
import com.nabajaran.api.entity.FestivalProgramme;
import com.nabajaran.api.entity.GalleryImage;
import com.nabajaran.api.entity.Sponsor;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.EventRepository;
import com.nabajaran.api.repository.FestivalEditionRepository;
import com.nabajaran.api.repository.FestivalProgrammeRepository;
import com.nabajaran.api.repository.FestivalRepository;
import com.nabajaran.api.repository.GalleryImageRepository;
import com.nabajaran.api.repository.SponsorRepository;
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
public class FestivalEditionService {

    private final FestivalEditionRepository editionRepository;
    private final FestivalProgrammeRepository programmeRepository;
    private final FestivalRepository festivalRepository;
    private final EventRepository eventRepository;
    private final GalleryImageRepository galleryImageRepository;
    private final SponsorRepository sponsorRepository;
    private final EntityManager entityManager;

    public FestivalEditionService(
            FestivalEditionRepository editionRepository,
            FestivalProgrammeRepository programmeRepository,
            FestivalRepository festivalRepository,
            EventRepository eventRepository,
            GalleryImageRepository galleryImageRepository,
            SponsorRepository sponsorRepository,
            EntityManager entityManager) {
        this.editionRepository = editionRepository;
        this.programmeRepository = programmeRepository;
        this.festivalRepository = festivalRepository;
        this.eventRepository = eventRepository;
        this.galleryImageRepository = galleryImageRepository;
        this.sponsorRepository = sponsorRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public AdminFestivalEditionPageResponse getAdminEditions(Long festivalId, int page, int size) {
        findActiveFestival(festivalId);
        Specification<FestivalEdition> specification = (root, query, criteriaBuilder) ->
                criteriaBuilder.and(
                        criteriaBuilder.equal(root.get("festival").get("id"), festivalId),
                        criteriaBuilder.isFalse(root.get("deleted")));
        Page<FestivalEdition> editions = editionRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("year").descending().and(Sort.by("id").descending())));
        return new AdminFestivalEditionPageResponse(
                editions.getContent().stream().map(edition -> toResponse(edition, false)).toList(),
                editions.getNumber(),
                editions.getSize(),
                editions.getTotalElements(),
                editions.getTotalPages());
    }

    @Transactional(readOnly = true)
    public FestivalEditionResponse getAdminEdition(Long festivalId, Long editionId) {
        findActiveFestival(festivalId);
        return toResponse(findActiveEdition(festivalId, editionId), false);
    }

    @Transactional
    public FestivalEditionResponse createEdition(Long festivalId, FestivalEditionRequest request) {
        Festival festival = findActiveFestival(festivalId);
        if (editionRepository.existsByFestival_IdAndYearAndDeletedFalse(festivalId, request.year())) {
            throw new ConflictException("An active edition already exists for this festival year.");
        }

        FestivalEdition edition = new FestivalEdition();
        edition.setFestival(festival);
        applyRequest(edition, request);
        return saveEdition(edition);
    }

    @Transactional
    public FestivalEditionResponse updateEdition(
            Long festivalId,
            Long editionId,
            FestivalEditionRequest request) {
        findActiveFestival(festivalId);
        FestivalEdition edition = findActiveEdition(festivalId, editionId);
        if (editionRepository.existsByFestival_IdAndYearAndDeletedFalseAndIdNot(
                festivalId, request.year(), editionId)) {
            throw new ConflictException("An active edition already exists for this festival year.");
        }
        applyRequest(edition, request);
        return saveEdition(edition);
    }

    @Transactional
    public FestivalEditionResponse publishEdition(Long festivalId, Long editionId) {
        findActiveFestival(festivalId);
        FestivalEdition edition = findActiveEdition(festivalId, editionId);
        edition.setPublished(true);
        return saveEdition(edition);
    }

    @Transactional
    public FestivalEditionResponse unpublishEdition(Long festivalId, Long editionId) {
        findActiveFestival(festivalId);
        FestivalEdition edition = findActiveEdition(festivalId, editionId);
        edition.setPublished(false);
        return saveEdition(edition);
    }

    @Transactional
    public void deleteEdition(Long festivalId, Long editionId) {
        findActiveFestival(festivalId);
        FestivalEdition edition = findActiveEdition(festivalId, editionId);
        edition.setDeleted(true);
        edition.setDeletedAt(LocalDateTime.now());
        editionRepository.save(edition);
    }

    @Transactional(readOnly = true)
    public List<FestivalEditionResponse> getPublishedEditions(Long festivalId) {
        return editionRepository
                .findByFestival_IdAndPublishedTrueAndDeletedFalseOrderByYearDesc(festivalId)
                .stream()
                .map(edition -> toResponse(edition, true))
                .toList();
    }

    private Festival findActiveFestival(Long festivalId) {
        return festivalRepository.findByIdAndDeletedFalse(festivalId)
                .orElseThrow(() -> new ResourceNotFoundException("Festival not found."));
    }

    private FestivalEdition findActiveEdition(Long festivalId, Long editionId) {
        return editionRepository.findByIdAndFestival_IdAndDeletedFalse(editionId, festivalId)
                .orElseThrow(() -> new ResourceNotFoundException("Festival edition not found."));
    }

    private void applyRequest(FestivalEdition edition, FestivalEditionRequest request) {
        edition.setYear(request.year());
        edition.setTheme(cleanOptional(request.theme()));
        edition.setDescription(cleanOptional(request.description()));
        edition.setFeaturedHighlights(cleanOptional(request.featuredHighlights()));
        edition.setStartDate(request.startDate());
        edition.setEndDate(request.endDate());
        edition.setVenue(cleanOptional(request.venue()));
        edition.setAddress(cleanOptional(request.address()));
        edition.setPublished(request.published());
        edition.setScheduledEvents(resolveEvents(request.eventIds()));
        edition.setGalleryImages(resolveGalleryImages(request.galleryImageIds()));
        edition.setSponsors(resolveSponsors(request.sponsorIds()));
    }

    private Set<Event> resolveEvents(List<Long> ids) {
        List<Long> uniqueIds = uniqueIds(ids);
        List<Event> events = uniqueIds.isEmpty()
                ? List.of()
                : eventRepository.findAllByIdInAndDeletedFalse(uniqueIds);
        if (events.size() != uniqueIds.size()) {
            throw new ResourceNotFoundException("One or more selected events are unavailable.");
        }
        return new LinkedHashSet<>(events);
    }

    private Set<GalleryImage> resolveGalleryImages(List<Long> ids) {
        List<Long> uniqueIds = uniqueIds(ids);
        List<GalleryImage> images = uniqueIds.isEmpty()
                ? List.of()
                : galleryImageRepository.findAllByIdInAndDeletedFalse(uniqueIds);
        if (images.size() != uniqueIds.size()) {
            throw new ResourceNotFoundException("One or more selected gallery images are unavailable.");
        }
        return new LinkedHashSet<>(images);
    }

    private Set<Sponsor> resolveSponsors(List<Long> ids) {
        List<Long> uniqueIds = uniqueIds(ids);
        List<Sponsor> sponsors = uniqueIds.isEmpty()
                ? List.of()
                : sponsorRepository.findAllByIdInAndDeletedFalse(uniqueIds);
        if (sponsors.size() != uniqueIds.size()) {
            throw new ResourceNotFoundException("One or more selected sponsors are unavailable.");
        }
        return new LinkedHashSet<>(sponsors);
    }

    private List<Long> uniqueIds(List<Long> ids) {
        return ids == null ? List.of() : new ArrayList<>(new LinkedHashSet<>(ids));
    }

    private FestivalEditionResponse saveEdition(FestivalEdition edition) {
        try {
            FestivalEdition savedEdition = editionRepository.saveAndFlush(edition);
            entityManager.refresh(savedEdition);
            return toResponse(savedEdition, false);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("The festival edition conflicts with existing data.");
        }
    }

    private FestivalEditionResponse toResponse(FestivalEdition edition, boolean publicView) {
        List<FestivalAssociationOptionResponse> events = edition.getScheduledEvents().stream()
                .filter(event -> !event.isDeleted() && (!publicView || event.isPublished()))
                .sorted(Comparator.comparing(Event::getStartAt).thenComparing(Event::getTitle))
                .map(event -> new FestivalAssociationOptionResponse(
                        event.getId(),
                        event.getTitle(),
                        eventDetail(event),
                        event.getImageUrl(),
                        event.getStartAt(),
                        event.getStatus().name(),
                        event.isPublished()))
                .toList();
        List<FestivalAssociationOptionResponse> galleryImages = edition.getGalleryImages().stream()
                .filter(image -> !image.isDeleted() && (!publicView || image.isPublicImage()))
                .sorted(Comparator.comparing(
                        image -> image.getTitle() == null ? "" : image.getTitle(),
                        String.CASE_INSENSITIVE_ORDER))
                .map(image -> new FestivalAssociationOptionResponse(
                        image.getId(),
                        image.getTitle() == null || image.getTitle().isBlank()
                                ? "Gallery image " + image.getId()
                                : image.getTitle(),
                        image.getCaption(),
                        image.getImageUrl(),
                        null,
                        image.isPublicImage() ? "PUBLIC" : "PRIVATE",
                        image.isPublicImage()))
                .toList();
        List<FestivalAssociationOptionResponse> sponsors = edition.getSponsors().stream()
                .filter(sponsor -> !sponsor.isDeleted() && (!publicView || sponsor.isActive()))
                .sorted(Comparator.comparing(Sponsor::getName, String.CASE_INSENSITIVE_ORDER))
                .map(sponsor -> new FestivalAssociationOptionResponse(
                        sponsor.getId(),
                        sponsor.getName(),
                        sponsor.getSponsorTier(),
                        sponsor.getLogoUrl(),
                        null,
                        sponsor.isActive() ? "ACTIVE" : "INACTIVE",
                        sponsor.isActive()))
                .toList();
        List<FestivalProgrammeResponse> programmes = programmeRepository
                .findByFestivalEdition_IdAndDeletedFalseOrderByProgrammeDateAscDisplayOrderAscStartTimeAscIdAsc(
                        edition.getId())
                .stream()
                .filter(programme -> !publicView || programme.isPublished())
                .map(this::toProgrammeResponse)
                .toList();

        return new FestivalEditionResponse(
                edition.getId(),
                edition.getFestival().getId(),
                edition.getFestival().getName(),
                edition.getYear(),
                edition.getTheme(),
                edition.getDescription(),
                edition.getFeaturedHighlights(),
                edition.getStartDate(),
                edition.getEndDate(),
                edition.getVenue(),
                edition.getAddress(),
                edition.isPublished(),
                events,
                galleryImages,
                sponsors,
                programmes,
                edition.getCreatedAt(),
                edition.getUpdatedAt());
    }

    private FestivalProgrammeResponse toProgrammeResponse(FestivalProgramme programme) {
        return new FestivalProgrammeResponse(
                programme.getId(),
                programme.getFestivalEdition().getId(),
                programme.getFestivalEdition().getYear(),
                programme.getTitle(),
                programme.getDescription(),
                programme.getProgrammeDate(),
                programme.getStartTime(),
                programme.getEndTime(),
                programme.getVenue(),
                programme.getDisplayOrder(),
                programme.isPublished(),
                programme.getCreatedAt(),
                programme.getUpdatedAt());
    }

    private String eventDetail(Event event) {
        String detail = event.getEventType();
        if (event.getVenue() != null && !event.getVenue().isBlank()) {
            detail += " · " + event.getVenue();
        }
        return detail;
    }

    private String cleanOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
