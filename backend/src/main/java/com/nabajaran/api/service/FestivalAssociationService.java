package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminFestivalAssociationPageResponse;
import com.nabajaran.api.dto.FestivalAssociationOptionResponse;
import com.nabajaran.api.entity.Event;
import com.nabajaran.api.entity.GalleryImage;
import com.nabajaran.api.entity.Sponsor;
import com.nabajaran.api.enums.FestivalAssociationType;
import com.nabajaran.api.repository.EventRepository;
import com.nabajaran.api.repository.GalleryImageRepository;
import com.nabajaran.api.repository.SponsorRepository;
import jakarta.persistence.criteria.Predicate;
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
public class FestivalAssociationService {

    private final EventRepository eventRepository;
    private final GalleryImageRepository galleryImageRepository;
    private final SponsorRepository sponsorRepository;

    public FestivalAssociationService(
            EventRepository eventRepository,
            GalleryImageRepository galleryImageRepository,
            SponsorRepository sponsorRepository) {
        this.eventRepository = eventRepository;
        this.galleryImageRepository = galleryImageRepository;
        this.sponsorRepository = sponsorRepository;
    }

    @Transactional(readOnly = true)
    public AdminFestivalAssociationPageResponse getOptions(
            FestivalAssociationType type,
            String search,
            int page,
            int size) {
        return switch (type) {
            case EVENT -> getEventOptions(search, page, size);
            case GALLERY_IMAGE -> getGalleryOptions(search, page, size);
            case SPONSOR -> getSponsorOptions(search, page, size);
        };
    }

    private AdminFestivalAssociationPageResponse getEventOptions(String search, int page, int size) {
        Specification<Event> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("eventType")), pattern, '\\')));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<Event> results = eventRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("startAt").descending().and(Sort.by("id").descending())));
        return pageResponse(results, results.getContent().stream()
                .map(this::toOption)
                .toList());
    }

    private AdminFestivalAssociationPageResponse getGalleryOptions(String search, int page, int size) {
        Specification<GalleryImage> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("caption")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern, '\\')));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<GalleryImage> results = galleryImageRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id").descending())));
        return pageResponse(results, results.getContent().stream()
                .map(this::toOption)
                .toList());
    }

    private AdminFestivalAssociationPageResponse getSponsorOptions(String search, int page, int size) {
        Specification<Sponsor> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("sponsorTier")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("slug")), pattern, '\\')));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<Sponsor> results = sponsorRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("name").ascending().and(Sort.by("id").ascending())));
        return pageResponse(results, results.getContent().stream()
                .map(this::toOption)
                .toList());
    }

    private FestivalAssociationOptionResponse toOption(Event event) {
        String detail = event.getEventType();
        if (event.getVenue() != null && !event.getVenue().isBlank()) {
            detail += " · " + event.getVenue();
        }
        return new FestivalAssociationOptionResponse(
                event.getId(),
                event.getTitle(),
                detail,
                event.getImageUrl(),
                event.getStartAt(),
                event.getStatus().name(),
                event.isPublished());
    }

    private FestivalAssociationOptionResponse toOption(GalleryImage image) {
        String label = image.getTitle() == null || image.getTitle().isBlank()
                ? "Gallery image " + image.getId()
                : image.getTitle();
        String detail = image.getCaption() == null || image.getCaption().isBlank()
                ? image.getCategory()
                : image.getCaption();
        return new FestivalAssociationOptionResponse(
                image.getId(),
                label,
                detail,
                image.getImageUrl(),
                null,
                image.isPublicImage() ? "PUBLIC" : "PRIVATE",
                image.isPublicImage());
    }

    private FestivalAssociationOptionResponse toOption(Sponsor sponsor) {
        return new FestivalAssociationOptionResponse(
                sponsor.getId(),
                sponsor.getName(),
                sponsor.getSponsorTier(),
                sponsor.getLogoUrl(),
                null,
                sponsor.isActive() ? "ACTIVE" : "INACTIVE",
                sponsor.isActive());
    }

    private AdminFestivalAssociationPageResponse pageResponse(
            Page<?> results,
            List<FestivalAssociationOptionResponse> content) {
        return new AdminFestivalAssociationPageResponse(
                content,
                results.getNumber(),
                results.getSize(),
                results.getTotalElements(),
                results.getTotalPages());
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
