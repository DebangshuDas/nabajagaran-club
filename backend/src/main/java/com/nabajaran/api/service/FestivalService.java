package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminFestivalPageResponse;
import com.nabajaran.api.dto.FestivalPublicResponse;
import com.nabajaran.api.dto.FestivalRequest;
import com.nabajaran.api.dto.FestivalResponse;
import com.nabajaran.api.entity.Festival;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.FestivalEditionRepository;
import com.nabajaran.api.repository.FestivalRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FestivalService {

    private final FestivalRepository festivalRepository;
    private final FestivalEditionRepository editionRepository;
    private final FestivalEditionService editionService;
    private final EntityManager entityManager;

    public FestivalService(
            FestivalRepository festivalRepository,
            FestivalEditionRepository editionRepository,
            FestivalEditionService editionService,
            EntityManager entityManager) {
        this.festivalRepository = festivalRepository;
        this.editionRepository = editionRepository;
        this.editionService = editionService;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public AdminFestivalPageResponse getAdminFestivals(String search, Boolean published, int page, int size) {
        Specification<Festival> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("slug")), pattern, '\\')));
            }
            if (published != null) {
                predicates.add(criteriaBuilder.equal(root.get("published"), published));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<Festival> festivals = festivalRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("name").ascending().and(Sort.by("id").ascending())));
        return new AdminFestivalPageResponse(
                festivals.getContent().stream().map(this::toResponse).toList(),
                festivals.getNumber(),
                festivals.getSize(),
                festivals.getTotalElements(),
                festivals.getTotalPages());
    }

    @Transactional(readOnly = true)
    public FestivalResponse getAdminFestival(Long id) {
        return toResponse(findActiveFestival(id));
    }

    @Transactional(readOnly = true)
    public List<FestivalResponse> getPublishedFestivals() {
        return festivalRepository.findByPublishedTrueAndDeletedFalseOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FestivalPublicResponse getPublishedFestival(String slug) {
        Festival festival = festivalRepository.findBySlugAndPublishedTrueAndDeletedFalse(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Festival not found."));
        return new FestivalPublicResponse(
                festival.getId(),
                festival.getName(),
                festival.getSlug(),
                festival.getDescription(),
                festival.getHistory(),
                festival.getCoverImageUrl(),
                editionService.getPublishedEditions(festival.getId()));
    }

    @Transactional
    public FestivalResponse createFestival(FestivalRequest request) {
        if (festivalRepository.existsBySlug(request.slug())) {
            throw new ConflictException("A festival with this slug already exists.");
        }
        Festival festival = new Festival();
        applyRequest(festival, request);
        return saveFestival(festival);
    }

    @Transactional
    public FestivalResponse updateFestival(Long id, FestivalRequest request) {
        Festival festival = findActiveFestival(id);
        if (festivalRepository.existsBySlugAndIdNot(request.slug(), id)) {
            throw new ConflictException("A festival with this slug already exists.");
        }
        applyRequest(festival, request);
        return saveFestival(festival);
    }

    @Transactional
    public FestivalResponse publishFestival(Long id) {
        Festival festival = findActiveFestival(id);
        festival.setPublished(true);
        return saveFestival(festival);
    }

    @Transactional
    public FestivalResponse unpublishFestival(Long id) {
        Festival festival = findActiveFestival(id);
        festival.setPublished(false);
        return saveFestival(festival);
    }

    @Transactional
    public void deleteFestival(Long id) {
        Festival festival = findActiveFestival(id);
        if (editionRepository.existsByFestival_Id(id)) {
            throw new ConflictException("A festival with edition history cannot be deleted. Unpublish it instead.");
        }
        festival.setDeleted(true);
        festival.setDeletedAt(LocalDateTime.now());
        festivalRepository.save(festival);
    }

    private Festival findActiveFestival(Long id) {
        return festivalRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Festival not found."));
    }

    private void applyRequest(Festival festival, FestivalRequest request) {
        festival.setName(request.name().trim());
        festival.setSlug(request.slug().trim());
        festival.setDescription(cleanOptional(request.description()));
        festival.setHistory(cleanOptional(request.history()));
        festival.setCoverImageUrl(cleanOptional(request.coverImageUrl()));
        festival.setPublished(request.published());
    }

    private FestivalResponse saveFestival(Festival festival) {
        try {
            Festival savedFestival = festivalRepository.saveAndFlush(festival);
            entityManager.refresh(savedFestival);
            return toResponse(savedFestival);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("The festival conflicts with existing data.");
        }
    }

    private FestivalResponse toResponse(Festival festival) {
        return new FestivalResponse(
                festival.getId(),
                festival.getName(),
                festival.getSlug(),
                festival.getDescription(),
                festival.getHistory(),
                festival.getCoverImageUrl(),
                festival.isPublished(),
                festival.getCreatedAt(),
                festival.getUpdatedAt());
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
