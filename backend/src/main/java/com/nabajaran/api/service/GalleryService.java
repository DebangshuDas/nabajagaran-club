package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminGalleryAlbumPageResponse;
import com.nabajaran.api.dto.AdminGalleryAssociationPageResponse;
import com.nabajaran.api.dto.FestivalAssociationOptionResponse;
import com.nabajaran.api.dto.GalleryAlbumRequest;
import com.nabajaran.api.dto.GalleryAlbumResponse;
import com.nabajaran.api.dto.GalleryAssociationOptionResponse;
import com.nabajaran.api.dto.GalleryImageMetadataRequest;
import com.nabajaran.api.dto.GalleryImageOrderRequest;
import com.nabajaran.api.dto.GalleryImageResponse;
import com.nabajaran.api.entity.ClubInformation;
import com.nabajaran.api.entity.CommunityInitiative;
import com.nabajaran.api.entity.Event;
import com.nabajaran.api.entity.FestivalEdition;
import com.nabajaran.api.entity.GalleryAlbum;
import com.nabajaran.api.entity.GalleryImage;
import com.nabajaran.api.enums.GalleryAssociationType;
import com.nabajaran.api.exception.BadRequestException;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.ClubInformationRepository;
import com.nabajaran.api.repository.CommunityInitiativeRepository;
import com.nabajaran.api.repository.EventRepository;
import com.nabajaran.api.repository.FestivalEditionRepository;
import com.nabajaran.api.repository.GalleryAlbumRepository;
import com.nabajaran.api.repository.GalleryImageRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GalleryService {

    private static final Logger logger = LoggerFactory.getLogger(GalleryService.class);
    private final GalleryAlbumRepository albumRepository;
    private final GalleryImageRepository imageRepository;
    private final ClubInformationRepository clubInformationRepository;
    private final EventRepository eventRepository;
    private final CommunityInitiativeRepository initiativeRepository;
    private final FestivalEditionRepository editionRepository;
    private final GalleryImageValidator imageValidator;
    private final GalleryObjectStorage objectStorage;

    public GalleryService(
            GalleryAlbumRepository albumRepository,
            GalleryImageRepository imageRepository,
            ClubInformationRepository clubInformationRepository,
            EventRepository eventRepository,
            CommunityInitiativeRepository initiativeRepository,
            FestivalEditionRepository editionRepository,
            GalleryImageValidator imageValidator,
            GalleryObjectStorage objectStorage) {
        this.albumRepository = albumRepository;
        this.imageRepository = imageRepository;
        this.clubInformationRepository = clubInformationRepository;
        this.eventRepository = eventRepository;
        this.initiativeRepository = initiativeRepository;
        this.editionRepository = editionRepository;
        this.imageValidator = imageValidator;
        this.objectStorage = objectStorage;
    }

    @Transactional(readOnly = true)
    public AdminGalleryAlbumPageResponse getAdminAlbums(
            String search,
            String category,
            Boolean published,
            int page,
            int size) {
        Specification<GalleryAlbum> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern, '\\')));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("category")),
                        category.trim().toLowerCase(Locale.ROOT)));
            }
            if (published != null) {
                predicates.add(criteriaBuilder.equal(root.get("published"), published));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<GalleryAlbum> albums = albumRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("updatedAt").descending().and(Sort.by("id").descending())));
        Map<Long, List<GalleryImage>> imagesByAlbum = loadImages(albums.getContent(), false);
        return new AdminGalleryAlbumPageResponse(
                albums.getContent().stream()
                        .map(album -> toAlbumResponse(album, imagesByAlbum.getOrDefault(album.getId(), List.of()), false))
                        .toList(),
                albums.getNumber(),
                albums.getSize(),
                albums.getTotalElements(),
                albums.getTotalPages());
    }

    @Transactional(readOnly = true)
    public GalleryAlbumResponse getAdminAlbum(Long id) {
        GalleryAlbum album = findActiveAlbum(id);
        List<GalleryImage> images = imageRepository.findByAlbum_IdAndDeletedFalseOrderByDisplayOrderAscIdAsc(id);
        return toAlbumResponse(album, images, false);
    }

    @Transactional(readOnly = true)
    public List<GalleryAlbumResponse> getPublishedAlbums(String category) {
        List<GalleryAlbum> albums = albumRepository.findByPublishedTrueAndDeletedFalseOrderByUpdatedAtDescIdDesc()
                .stream()
                .filter(album -> category == null || category.isBlank()
                        || (album.getCategory() != null
                                && album.getCategory().equalsIgnoreCase(category.trim())))
                .toList();
        Map<Long, List<GalleryImage>> imagesByAlbum = loadImages(albums, true);
        return albums.stream()
                .map(album -> toAlbumResponse(album, imagesByAlbum.getOrDefault(album.getId(), List.of()), true))
                .toList();
    }

    @Transactional
    public GalleryAlbumResponse createAlbum(GalleryAlbumRequest request) {
        ClubInformation clubInformation = clubInformationRepository.findFirstByDeletedFalseOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "An active club profile is required to create gallery albums."));
        GalleryAlbum album = new GalleryAlbum();
        album.setClubInformation(clubInformation);
        applyAlbumRequest(album, request, true);
        GalleryAlbum saved = albumRepository.saveAndFlush(album);
        return toAlbumResponse(saved, List.of(), false);
    }

    @Transactional
    public GalleryAlbumResponse updateAlbum(Long id, GalleryAlbumRequest request) {
        GalleryAlbum album = findActiveAlbum(id);
        applyAlbumRequest(album, request, false);
        GalleryAlbum saved = albumRepository.saveAndFlush(album);
        List<GalleryImage> images = imageRepository.findByAlbum_IdAndDeletedFalseOrderByDisplayOrderAscIdAsc(id);
        return toAlbumResponse(saved, images, false);
    }

    @Transactional
    public GalleryAlbumResponse publishAlbum(Long id, boolean published) {
        GalleryAlbum album = findActiveAlbum(id);
        album.setPublished(published);
        GalleryAlbum saved = albumRepository.saveAndFlush(album);
        List<GalleryImage> images = imageRepository.findByAlbum_IdAndDeletedFalseOrderByDisplayOrderAscIdAsc(id);
        return toAlbumResponse(saved, images, false);
    }

    @Transactional
    public void deleteAlbum(Long id) {
        GalleryAlbum album = findActiveAlbum(id);
        LocalDateTime deletedAt = LocalDateTime.now();
        album.setDeleted(true);
        album.setDeletedAt(deletedAt);
        album.setPublished(false);
        albumRepository.save(album);
        List<GalleryImage> images = imageRepository.findByAlbum_IdAndDeletedFalseOrderByDisplayOrderAscIdAsc(id);
        images.forEach(image -> {
            image.setDeleted(true);
            image.setDeletedAt(deletedAt);
            image.setPublicImage(false);
        });
        imageRepository.saveAll(images);
    }

    @Transactional
    public List<GalleryImageResponse> uploadImages(Long albumId, List<MultipartFile> files) {
        GalleryAlbum album = findActiveAlbum(albumId);
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("Select at least one image to upload.");
        }
        if (files.size() > GalleryImageValidator.MAX_FILES_PER_UPLOAD) {
            throw new BadRequestException("No more than 10 images can be uploaded at once.");
        }

        List<ValidatedGalleryImage> validatedImages = files.stream().map(imageValidator::validate).toList();
        int nextDisplayOrder = imageRepository.findByAlbum_IdAndDeletedFalseOrderByDisplayOrderAscIdAsc(albumId)
                .size();
        List<GalleryImage> images = new ArrayList<>();
        List<String> uploadedKeys = new ArrayList<>();
        try {
            for (int index = 0; index < validatedImages.size(); index++) {
                ValidatedGalleryImage validatedImage = validatedImages.get(index);
                String key = "gallery/" + album.getClubInformation().getId() + "/" + albumId + "/"
                        + UUID.randomUUID() + "." + validatedImage.extension();
                objectStorage.upload(key, validatedImage.contents(), validatedImage.contentType());
                uploadedKeys.add(key);

                GalleryImage image = new GalleryImage();
                image.setClubInformation(album.getClubInformation());
                image.setAlbum(album);
                image.setTitle(validatedImage.title());
                image.setImageUrl(objectStorage.publicUrl(key));
                image.setStorageKey(key);
                image.setCategory(album.getCategory());
                image.setDisplayOrder(nextDisplayOrder + index);
                image.setPublicImage(false);
                images.add(image);
            }
            return imageRepository.saveAllAndFlush(images).stream()
                    .map(this::toImageResponse)
                    .toList();
        } catch (RuntimeException ex) {
            deleteUploadedObjects(uploadedKeys, ex);
            throw ex;
        }
    }

    @Transactional
    public GalleryImageResponse updateImage(Long id, GalleryImageMetadataRequest request) {
        GalleryImage image = findActiveImage(id);
        GalleryAlbum targetAlbum = findActiveAlbum(request.albumId());
        if (!image.getClubInformation().getId().equals(targetAlbum.getClubInformation().getId())) {
            throw new BadRequestException("An image cannot be moved to another club profile's album.");
        }
        GalleryAlbum previousAlbum = image.getAlbum();
        if (!previousAlbum.getId().equals(targetAlbum.getId())
                && previousAlbum.getCoverImageId() != null
                && previousAlbum.getCoverImageId().equals(image.getId())) {
            previousAlbum.setCoverImageId(null);
            albumRepository.save(previousAlbum);
        }
        image.setAlbum(targetAlbum);
        image.setClubInformation(targetAlbum.getClubInformation());
        image.setTitle(cleanOptional(request.title()));
        image.setCaption(cleanOptional(request.caption()));
        image.setAltText(cleanOptional(request.altText()));
        image.setCategory(targetAlbum.getCategory());
        image.setDisplayOrder(request.displayOrder());
        image.setPublicImage(request.published());
        return toImageResponse(imageRepository.saveAndFlush(image));
    }

    @Transactional
    public GalleryImageResponse publishImage(Long id, boolean published) {
        GalleryImage image = findActiveImage(id);
        image.setPublicImage(published);
        GalleryImage saved = imageRepository.saveAndFlush(image);
        if (!published && image.getAlbum().getCoverImageId() != null
                && image.getAlbum().getCoverImageId().equals(image.getId())) {
            image.getAlbum().setCoverImageId(null);
            albumRepository.save(image.getAlbum());
        }
        return toImageResponse(saved);
    }

    @Transactional
    public void deleteImage(Long id) {
        GalleryImage image = findActiveImage(id);
        image.setDeleted(true);
        image.setDeletedAt(LocalDateTime.now());
        image.setPublicImage(false);
        if (image.getAlbum().getCoverImageId() != null
                && image.getAlbum().getCoverImageId().equals(image.getId())) {
            image.getAlbum().setCoverImageId(null);
            albumRepository.save(image.getAlbum());
        }
        imageRepository.save(image);
    }

    @Transactional
    public List<GalleryImageResponse> reorderImages(Long albumId, GalleryImageOrderRequest request) {
        findActiveAlbum(albumId);
        List<Long> imageIds = request.imageIds();
        Set<Long> uniqueIds = new LinkedHashSet<>(imageIds);
        if (uniqueIds.size() != imageIds.size()) {
            throw new BadRequestException("Image IDs in the order must be unique.");
        }
        List<GalleryImage> albumImages = imageRepository.findByAlbum_IdAndDeletedFalseOrderByDisplayOrderAscIdAsc(
                albumId);
        Set<Long> actualIds = albumImages.stream().map(GalleryImage::getId).collect(Collectors.toSet());
        if (!actualIds.equals(uniqueIds)) {
            throw new BadRequestException("The order must include every active image in the album exactly once.");
        }
        Map<Long, GalleryImage> imagesById = albumImages.stream()
                .collect(Collectors.toMap(GalleryImage::getId, image -> image));
        List<GalleryImage> reordered = new ArrayList<>();
        for (int index = 0; index < imageIds.size(); index++) {
            GalleryImage image = imagesById.get(imageIds.get(index));
            image.setDisplayOrder(index);
            reordered.add(image);
        }
        return imageRepository.saveAllAndFlush(reordered).stream()
                .sorted(Comparator.comparingInt(GalleryImage::getDisplayOrder).thenComparing(GalleryImage::getId))
                .map(this::toImageResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminGalleryAssociationPageResponse getAssociationOptions(
            GalleryAssociationType type,
            String search,
            int page,
            int size) {
        return switch (type) {
            case EVENT -> eventOptions(search, page, size);
            case INITIATIVE -> initiativeOptions(search, page, size);
            case FESTIVAL_EDITION -> editionOptions(search, page, size);
        };
    }

    @Transactional(readOnly = true)
    public Map<Long, List<GalleryImageResponse>> getPublishedEventImages(List<Long> eventIds) {
        if (eventIds.isEmpty()) {
            return Map.of();
        }
        List<GalleryAlbum> albums = albumRepository.findByEvent_IdInAndPublishedTrueAndDeletedFalse(eventIds);
        return groupPublishedImagesByAlbumAssociation(albums, GalleryAssociationType.EVENT);
    }

    @Transactional(readOnly = true)
    public Map<Long, List<FestivalAssociationOptionResponse>> getEditionImages(
            List<Long> editionIds,
            boolean publicView) {
        if (editionIds.isEmpty()) {
            return Map.of();
        }
        List<GalleryAlbum> albums = publicView
                ? albumRepository.findByFestivalEdition_IdInAndPublishedTrueAndDeletedFalse(editionIds)
                : albumRepository.findByFestivalEdition_IdInAndDeletedFalse(editionIds);
        Map<Long, List<GalleryImage>> imagesByAlbum = loadImages(albums, publicView);
        Map<Long, List<FestivalAssociationOptionResponse>> result = new HashMap<>();
        for (GalleryAlbum album : albums) {
            Long editionId = album.getFestivalEdition().getId();
            for (GalleryImage image : imagesByAlbum.getOrDefault(album.getId(), List.of())) {
                result.computeIfAbsent(editionId, ignored -> new ArrayList<>()).add(toFestivalOption(image));
            }
        }
        result.replaceAll((key, images) -> images.stream()
                .sorted(Comparator.comparing(FestivalAssociationOptionResponse::id))
                .toList());
        return result;
    }

    private AdminGalleryAssociationPageResponse eventOptions(String search, int page, int size) {
        Specification<Event> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern, '\\'));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<Event> results = eventRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("startAt").descending().and(Sort.by("id").descending())));
        return associationPage(results, results.getContent().stream()
                .map(event -> new GalleryAssociationOptionResponse(
                        GalleryAssociationType.EVENT.name(),
                        event.getId(),
                        event.getTitle(),
                        event.getStartAt().toString()))
                .toList());
    }

    private AdminGalleryAssociationPageResponse initiativeOptions(String search, int page, int size) {
        Specification<CommunityInitiative> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern, '\\'),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern, '\\')));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<CommunityInitiative> results = initiativeRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("title").ascending().and(Sort.by("id").ascending())));
        return associationPage(results, results.getContent().stream()
                .map(initiative -> new GalleryAssociationOptionResponse(
                        GalleryAssociationType.INITIATIVE.name(),
                        initiative.getId(),
                        initiative.getTitle(),
                        initiative.getCategory()))
                .toList());
    }

    private AdminGalleryAssociationPageResponse editionOptions(String search, int page, int size) {
        Specification<FestivalEdition> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
            predicates.add(criteriaBuilder.isFalse(root.get("festival").get("deleted")));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("festival").get("name")), pattern, '\\'),
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("year").as(String.class)), pattern, '\\')));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
        Page<FestivalEdition> results = editionRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by("year").descending().and(Sort.by("id").descending())));
        return associationPage(results, results.getContent().stream()
                .map(edition -> new GalleryAssociationOptionResponse(
                        GalleryAssociationType.FESTIVAL_EDITION.name(),
                        edition.getId(),
                        edition.getFestival().getName() + " " + edition.getYear(),
                        edition.getTheme()))
                .toList());
    }

    private AdminGalleryAssociationPageResponse associationPage(
            Page<?> results,
            List<GalleryAssociationOptionResponse> options) {
        return new AdminGalleryAssociationPageResponse(
                options,
                results.getNumber(),
                results.getSize(),
                results.getTotalElements(),
                results.getTotalPages());
    }

    private Map<Long, List<GalleryImageResponse>> groupPublishedImagesByAlbumAssociation(
            List<GalleryAlbum> albums,
            GalleryAssociationType type) {
        Map<Long, List<GalleryImage>> imagesByAlbum = loadImages(albums, true);
        Map<Long, List<GalleryImageResponse>> result = new HashMap<>();
        for (GalleryAlbum album : albums) {
            Long targetId = switch (type) {
                case EVENT -> album.getEvent().getId();
                case INITIATIVE -> album.getInitiative().getId();
                case FESTIVAL_EDITION -> album.getFestivalEdition().getId();
            };
            result.computeIfAbsent(targetId, ignored -> new ArrayList<>()).addAll(
                    imagesByAlbum.getOrDefault(album.getId(), List.of()).stream()
                            .map(this::toImageResponse)
                            .toList());
        }
        result.replaceAll((key, images) -> images.stream()
                .sorted(Comparator.comparingInt(GalleryImageResponse::displayOrder)
                        .thenComparing(GalleryImageResponse::id))
                .toList());
        return result;
    }

    private Map<Long, List<GalleryImage>> loadImages(List<GalleryAlbum> albums, boolean publicView) {
        if (albums.isEmpty()) {
            return Map.of();
        }
        List<Long> albumIds = albums.stream().map(GalleryAlbum::getId).toList();
        List<GalleryImage> images = publicView
                ? imageRepository.findByAlbum_IdInAndPublicImageTrueAndDeletedFalseOrderByAlbum_IdAscDisplayOrderAscIdAsc(
                        albumIds)
                : imageRepository.findByAlbum_IdInAndDeletedFalseOrderByAlbum_IdAscDisplayOrderAscIdAsc(albumIds);
        return images.stream().collect(Collectors.groupingBy(
                image -> image.getAlbum().getId(),
                LinkedHashMap::new,
                Collectors.toList()));
    }

    private GalleryAlbumResponse toAlbumResponse(
            GalleryAlbum album,
            List<GalleryImage> images,
            boolean publicView) {
        Map<Long, GalleryImage> imagesById = images.stream()
                .collect(Collectors.toMap(GalleryImage::getId, image -> image));
        GalleryImage coverImage = album.getCoverImageId() == null
                ? null
                : imagesById.get(album.getCoverImageId());
        Event event = album.getEvent();
        CommunityInitiative initiative = album.getInitiative();
        FestivalEdition edition = album.getFestivalEdition();
        boolean visibleEvent = event != null && (!publicView || (event.isPublished() && !event.isDeleted()));
        boolean visibleInitiative = initiative != null
                && (!publicView || (initiative.isPublished() && !initiative.isDeleted()));
        boolean visibleEdition = edition != null
                && (!publicView || (edition.isPublished() && !edition.isDeleted()
                        && edition.getFestival().isPublished() && !edition.getFestival().isDeleted()));
        return new GalleryAlbumResponse(
                album.getId(),
                album.getTitle(),
                album.getDescription(),
                album.getCategory(),
                coverImage == null ? null : coverImage.getImageUrl(),
                visibleEvent ? event.getId() : null,
                visibleEvent ? event.getTitle() : null,
                visibleInitiative ? initiative.getId() : null,
                visibleInitiative ? initiative.getTitle() : null,
                visibleEdition ? edition.getId() : null,
                visibleEdition ? edition.getFestival().getName() : null,
                visibleEdition ? edition.getYear() : null,
                album.isPublished(),
                images.size(),
                images.stream().map(this::toImageResponse).toList(),
                album.getCreatedAt(),
                album.getUpdatedAt());
    }

    private GalleryImageResponse toImageResponse(GalleryImage image) {
        return new GalleryImageResponse(
                image.getId(),
                image.getAlbum().getId(),
                image.getTitle(),
                image.getCaption(),
                image.getAltText(),
                image.getImageUrl(),
                image.getDisplayOrder(),
                image.isPublicImage(),
                image.getCreatedAt(),
                image.getUpdatedAt());
    }

    private FestivalAssociationOptionResponse toFestivalOption(GalleryImage image) {
        return new FestivalAssociationOptionResponse(
                image.getId(),
                image.getTitle() == null || image.getTitle().isBlank()
                        ? "Gallery image " + image.getId()
                        : image.getTitle(),
                image.getCaption(),
                image.getImageUrl(),
                image.getAltText(),
                null,
                image.isPublicImage() ? "PUBLIC" : "PRIVATE",
                image.isPublicImage());
    }

    private void applyAlbumRequest(GalleryAlbum album, GalleryAlbumRequest request, boolean creating) {
        int associationCount = (request.eventId() == null ? 0 : 1)
                + (request.initiativeId() == null ? 0 : 1)
                + (request.festivalEditionId() == null ? 0 : 1);
        if (associationCount > 1) {
            throw new BadRequestException(
                    "An album can be associated with at most one event, initiative, or festival edition.");
        }

        album.setTitle(request.title().trim());
        album.setDescription(cleanOptional(request.description()));
        album.setCategory(cleanOptional(request.category()));
        album.setPublished(request.published());
        album.setEvent(request.eventId() == null
                ? null
                : eventRepository.findByIdAndDeletedFalse(request.eventId())
                        .orElseThrow(() -> new ResourceNotFoundException("Event not found.")));
        album.setInitiative(request.initiativeId() == null
                ? null
                : initiativeRepository.findByIdAndDeletedFalse(request.initiativeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Initiative not found.")));
        album.setFestivalEdition(request.festivalEditionId() == null
                ? null
                : editionRepository.findByIdAndDeletedFalse(request.festivalEditionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Festival edition not found.")));
        if (request.coverImageId() != null) {
            GalleryImage cover = findActiveImage(request.coverImageId());
            if (!cover.getAlbum().getId().equals(album.getId())) {
                throw new BadRequestException("The cover image must belong to this album.");
            }
            album.setCoverImageId(cover.getId());
        } else if (!creating) {
            album.setCoverImageId(null);
        }
    }

    private GalleryAlbum findActiveAlbum(Long id) {
        return albumRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery album not found."));
    }

    private GalleryImage findActiveImage(Long id) {
        return imageRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery image not found."));
    }

    private void deleteUploadedObjects(List<String> uploadedKeys, RuntimeException originalException) {
        for (String key : uploadedKeys) {
            try {
                objectStorage.delete(key);
            } catch (RuntimeException cleanupException) {
                logger.warn("Could not clean up incomplete gallery upload object {}", key, cleanupException);
                originalException.addSuppressed(cleanupException);
            }
        }
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
