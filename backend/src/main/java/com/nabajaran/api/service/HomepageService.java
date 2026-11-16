package com.nabajaran.api.service;

import com.nabajaran.api.dto.HomepageAdminResponse;
import com.nabajaran.api.dto.HomepageAdminSectionResponse;
import com.nabajaran.api.dto.HomepageOptionResponse;
import com.nabajaran.api.dto.HomepagePublicContentResponse;
import com.nabajaran.api.dto.HomepagePublicResponse;
import com.nabajaran.api.dto.HomepagePublicSectionResponse;
import com.nabajaran.api.dto.HomepageUpdateRequest;
import com.nabajaran.api.entity.Announcement;
import com.nabajaran.api.entity.CommunityInitiative;
import com.nabajaran.api.entity.Event;
import com.nabajaran.api.entity.Festival;
import com.nabajaran.api.entity.FestivalEdition;
import com.nabajaran.api.entity.GalleryImage;
import com.nabajaran.api.entity.HomepageConfiguration;
import com.nabajaran.api.entity.HomepageSection;
import com.nabajaran.api.entity.HomepageSectionItem;
import com.nabajaran.api.enums.HomepageSectionType;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.exception.InvalidRequestException;
import com.nabajaran.api.repository.AnnouncementRepository;
import com.nabajaran.api.repository.CommunityInitiativeRepository;
import com.nabajaran.api.repository.EventRepository;
import com.nabajaran.api.repository.FestivalEditionRepository;
import com.nabajaran.api.repository.FestivalRepository;
import com.nabajaran.api.repository.GalleryImageRepository;
import com.nabajaran.api.repository.HomepageConfigurationRepository;
import jakarta.persistence.EntityManager;
import java.net.URI;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HomepageService {

    private static final long CONFIGURATION_ID = 1L;
    private final HomepageConfigurationRepository configurationRepository;
    private final EventRepository eventRepository;
    private final AnnouncementRepository announcementRepository;
    private final CommunityInitiativeRepository initiativeRepository;
    private final FestivalRepository festivalRepository;
    private final FestivalEditionRepository editionRepository;
    private final GalleryImageRepository galleryImageRepository;
    private final EntityManager entityManager;

    public HomepageService(
            HomepageConfigurationRepository configurationRepository,
            EventRepository eventRepository,
            AnnouncementRepository announcementRepository,
            CommunityInitiativeRepository initiativeRepository,
            FestivalRepository festivalRepository,
            FestivalEditionRepository editionRepository,
            GalleryImageRepository galleryImageRepository,
            EntityManager entityManager) {
        this.configurationRepository = configurationRepository;
        this.eventRepository = eventRepository;
        this.announcementRepository = announcementRepository;
        this.initiativeRepository = initiativeRepository;
        this.festivalRepository = festivalRepository;
        this.editionRepository = editionRepository;
        this.galleryImageRepository = galleryImageRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public HomepagePublicResponse getPublicHomepage() {
        HomepageConfiguration configuration = getConfiguration();
        Map<HomepageSectionType, Map<String, HomepageContent>> catalog = getPublishedCatalog();
        List<HomepagePublicSectionResponse> sections = configuration.getSections().stream()
                .sorted(Comparator.comparingInt(HomepageSection::getDisplayOrder))
                .filter(HomepageSection::isVisible)
                .map(section -> new HomepagePublicSectionResponse(
                        section.getType(),
                        true,
                        section.getDisplayOrder(),
                        section.getItems().stream()
                                .sorted(Comparator.comparingInt(HomepageSectionItem::getDisplayOrder))
                                .map(item -> catalog.get(section.getType()).get(item.getContentKey()))
                                .filter(java.util.Objects::nonNull)
                                .map(content -> content.toPublicResponse(section.getType()))
                                .toList()))
                .toList();

        return new HomepagePublicResponse(
                configuration.getHeroTitle(),
                configuration.getHeroSubtitle(),
                configuration.getHeroImageUrl(),
                configuration.getCtaText(),
                configuration.getCtaUrl(),
                sections);
    }

    @Transactional(readOnly = true)
    public HomepageAdminResponse getAdminHomepage() {
        HomepageConfiguration configuration = getConfiguration();
        Map<HomepageSectionType, Map<String, HomepageContent>> catalog = getPublishedCatalog();
        List<HomepageAdminSectionResponse> sections = configuration.getSections().stream()
                .sorted(Comparator.comparingInt(HomepageSection::getDisplayOrder))
                .map(section -> {
                    Map<String, HomepageContent> choices = catalog.get(section.getType());
                    List<String> selectedIds = section.getItems().stream()
                            .sorted(Comparator.comparingInt(HomepageSectionItem::getDisplayOrder))
                            .map(HomepageSectionItem::getContentKey)
                            .filter(choices::containsKey)
                            .toList();
                    return new HomepageAdminSectionResponse(
                            section.getType(),
                            section.isVisible(),
                            section.getDisplayOrder(),
                            selectedIds,
                            choices.values().stream().map(HomepageContent::toOptionResponse).toList());
                })
                .toList();

        return new HomepageAdminResponse(
                configuration.getHeroTitle(),
                configuration.getHeroSubtitle(),
                configuration.getHeroImageUrl(),
                configuration.getCtaText(),
                configuration.getCtaUrl(),
                configuration.getUpdatedAt(),
                sections);
    }

    @Transactional
    public HomepageAdminResponse updateHomepage(HomepageUpdateRequest request) {
        validateRequest(request);
        Map<HomepageSectionType, Map<String, HomepageContent>> catalog = getPublishedCatalog();
        validateSelections(request, catalog);

        HomepageConfiguration configuration = getConfiguration();
        configuration.setHeroTitle(request.heroTitle().trim());
        configuration.setHeroSubtitle(cleanOptional(request.heroSubtitle()));
        configuration.setHeroImageUrl(cleanOptional(request.heroImageUrl()));
        configuration.setCtaText(cleanOptional(request.ctaText()));
        configuration.setCtaUrl(cleanOptional(request.ctaUrl()));

        configuration.getSections().clear();
        configurationRepository.flush();
        for (HomepageUpdateRequest.HomepageSectionUpdateRequest sectionRequest : request.sections()) {
            HomepageSection section = new HomepageSection();
            section.setConfiguration(configuration);
            section.setType(sectionRequest.type());
            section.setVisible(sectionRequest.visible());
            section.setDisplayOrder(sectionRequest.displayOrder());

            List<HomepageSectionItem> items = new ArrayList<>();
            for (int index = 0; index < sectionRequest.selectedIds().size(); index++) {
                HomepageSectionItem item = new HomepageSectionItem();
                item.setSection(section);
                item.setContentKey(sectionRequest.selectedIds().get(index));
                item.setDisplayOrder(index);
                items.add(item);
            }
            section.setItems(items);
            configuration.getSections().add(section);
        }

        configurationRepository.saveAndFlush(configuration);
        entityManager.refresh(configuration);
        return getAdminHomepage();
    }

    private HomepageConfiguration getConfiguration() {
        return configurationRepository.findWithSectionsById(CONFIGURATION_ID)
                .orElseThrow(() -> new ResourceNotFoundException("Homepage configuration not found."));
    }

    private void validateRequest(HomepageUpdateRequest request) {
        if (!isSafeUrl(request.heroImageUrl())) {
            throw new InvalidRequestException("Hero image URL must be an HTTP, HTTPS, or site-relative URL.");
        }
        if (!isSafeUrl(request.ctaUrl())) {
            throw new InvalidRequestException("Call-to-action URL must be an HTTP, HTTPS, or site-relative URL.");
        }
        Set<HomepageSectionType> types = new HashSet<>();
        Set<Integer> orders = new HashSet<>();
        for (HomepageUpdateRequest.HomepageSectionUpdateRequest section : request.sections()) {
            if (!types.add(section.type())) {
                throw new InvalidRequestException("Each homepage section may only be configured once.");
            }
            if (section.displayOrder() < 0 || section.displayOrder() >= HomepageSectionType.values().length
                    || !orders.add(section.displayOrder())) {
                throw new InvalidRequestException("Homepage section order must be a unique value between 0 and 5.");
            }
            if (new HashSet<>(section.selectedIds()).size() != section.selectedIds().size()) {
                throw new InvalidRequestException("A homepage section cannot contain duplicate selections.");
            }
        }
        if (!types.equals(Set.of(HomepageSectionType.values()))) {
            throw new InvalidRequestException("All supported homepage sections must be included.");
        }
    }

    private void validateSelections(
            HomepageUpdateRequest request,
            Map<HomepageSectionType, Map<String, HomepageContent>> catalog) {
        for (HomepageUpdateRequest.HomepageSectionUpdateRequest section : request.sections()) {
            Map<String, HomepageContent> choices = catalog.get(section.type());
            if (section.selectedIds().stream().anyMatch(id -> !choices.containsKey(id))) {
                throw new InvalidRequestException(
                        "Homepage selections must reference existing published content of the matching section.");
            }
        }
    }

    private boolean isSafeUrl(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String trimmed = value.trim();
        if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
            return !trimmed.contains("\\") && trimmed.chars().noneMatch(Character::isISOControl);
        }
        try {
            URI uri = URI.create(trimmed);
            return uri.getHost() != null
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private Map<HomepageSectionType, Map<String, HomepageContent>> getPublishedCatalog() {
        Map<HomepageSectionType, Map<String, HomepageContent>> catalog = new EnumMap<>(HomepageSectionType.class);
        for (HomepageSectionType type : HomepageSectionType.values()) {
            catalog.put(type, new LinkedHashMap<>());
        }

        for (Event event : eventRepository.findByPublishedTrueAndDeletedFalseOrderByStartAtAscIdAsc()) {
            catalog.get(HomepageSectionType.EVENTS).put(
                    event.getId().toString(),
                    new HomepageContent(
                            event.getId().toString(),
                            event.getTitle(),
                            firstNonBlank(event.getShortDescription(), event.getDescription()),
                            event.getStartAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                            event.getImageUrl(),
                            "/events"));
        }

        for (Announcement announcement : announcementRepository.findByPublishedTrueAndDeletedFalseOrderByPublishedAtDesc()) {
            catalog.get(HomepageSectionType.ANNOUNCEMENTS).put(
                    announcement.getId().toString(),
                    new HomepageContent(
                            announcement.getId().toString(),
                            announcement.getTitle(),
                            announcement.getContent(),
                            announcement.getAudience(),
                            null,
                            "/#announcements"));
        }

        for (CommunityInitiative initiative : initiativeRepository.findByPublishedTrueAndDeletedFalseOrderByTitleAsc()) {
            catalog.get(HomepageSectionType.INITIATIVES).put(
                    initiative.getId().toString(),
                    new HomepageContent(
                            initiative.getId().toString(),
                            initiative.getTitle(),
                            firstNonBlank(initiative.getShortDescription(), initiative.getDescription()),
                            initiative.getCategory(),
                            initiative.getImageUrl(),
                            "/initiatives"));
        }

        for (Festival festival : festivalRepository.findByPublishedTrueAndDeletedFalseOrderByNameAsc()) {
            catalog.get(HomepageSectionType.FESTIVALS).put(
                    festival.getId().toString(),
                    new HomepageContent(
                            festival.getId().toString(),
                            festival.getName(),
                            festival.getDescription(),
                            null,
                            festival.getCoverImageUrl(),
                            "/festivals/" + festival.getSlug()));
        }

        for (FestivalEdition edition : editionRepository.findByPublishedTrueAndDeletedFalseOrderByYearDescIdDesc()) {
            Festival festival = edition.getFestival();
            if (!festival.isPublished() || festival.isDeleted()) {
                continue;
            }
            String id = edition.getId().toString();
            catalog.get(HomepageSectionType.FESTIVAL_EDITIONS).put(
                    id,
                    new HomepageContent(
                            id,
                            festival.getName() + " " + edition.getYear(),
                            firstNonBlank(edition.getFeaturedHighlights(), edition.getDescription()),
                            firstNonBlank(edition.getTheme(), edition.getVenue()),
                            festival.getCoverImageUrl(),
                            "/festivals/" + festival.getSlug()));
        }

        Map<String, List<GalleryImage>> albums = new LinkedHashMap<>();
        for (GalleryImage image : galleryImageRepository
                .findByPublicImageTrueAndDeletedFalseAndCategoryIsNotNullOrderByCategoryAscIdAsc()) {
            if (image.getCategory() != null && !image.getCategory().isBlank()) {
                albums.computeIfAbsent(image.getCategory().trim(), ignored -> new ArrayList<>()).add(image);
            }
        }
        albums.forEach((category, images) -> {
            GalleryImage cover = images.get(0);
            catalog.get(HomepageSectionType.GALLERY_ALBUMS).put(
                    category,
                    new HomepageContent(
                            category,
                            category,
                            images.size() + (images.size() == 1 ? " photograph" : " photographs"),
                            null,
                            cover.getImageUrl(),
                            "/gallery?album=" + java.net.URLEncoder.encode(category, java.nio.charset.StandardCharsets.UTF_8)));
        });
        return catalog;
    }

    private String firstNonBlank(String preferred, String fallback) {
        return preferred == null || preferred.isBlank() ? fallback : preferred;
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record HomepageContent(
            String id,
            String title,
            String summary,
            String detail,
            String imageUrl,
            String url) {

        HomepageOptionResponse toOptionResponse() {
            return new HomepageOptionResponse(id, title, detail, imageUrl);
        }

        HomepagePublicContentResponse toPublicResponse(HomepageSectionType type) {
            return new HomepagePublicContentResponse(type, id, title, summary, detail, imageUrl, url);
        }
    }
}
