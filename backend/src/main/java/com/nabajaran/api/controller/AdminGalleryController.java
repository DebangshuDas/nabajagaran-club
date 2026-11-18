package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminGalleryAlbumPageResponse;
import com.nabajaran.api.dto.AdminGalleryAssociationPageResponse;
import com.nabajaran.api.dto.GalleryAlbumRequest;
import com.nabajaran.api.dto.GalleryAlbumResponse;
import com.nabajaran.api.dto.GalleryImageMetadataRequest;
import com.nabajaran.api.dto.GalleryImageOrderRequest;
import com.nabajaran.api.dto.GalleryImageResponse;
import com.nabajaran.api.enums.GalleryAssociationType;
import com.nabajaran.api.service.GalleryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api/v1/admin/gallery")
public class AdminGalleryController {

    private final GalleryService galleryService;

    public AdminGalleryController(GalleryService galleryService) {
        this.galleryService = galleryService;
    }

    @GetMapping("/albums")
    public ResponseEntity<AdminGalleryAlbumPageResponse> getAlbums(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(galleryService.getAdminAlbums(search, category, published, page, size));
    }

    @GetMapping("/albums/{albumId}")
    public ResponseEntity<GalleryAlbumResponse> getAlbum(@PathVariable Long albumId) {
        return ResponseEntity.ok(galleryService.getAdminAlbum(albumId));
    }

    @PostMapping("/albums")
    public ResponseEntity<GalleryAlbumResponse> createAlbum(@Valid @RequestBody GalleryAlbumRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(galleryService.createAlbum(request));
    }

    @PutMapping("/albums/{albumId}")
    public ResponseEntity<GalleryAlbumResponse> updateAlbum(
            @PathVariable Long albumId,
            @Valid @RequestBody GalleryAlbumRequest request) {
        return ResponseEntity.ok(galleryService.updateAlbum(albumId, request));
    }

    @PatchMapping("/albums/{albumId}/publish")
    public ResponseEntity<GalleryAlbumResponse> publishAlbum(@PathVariable Long albumId) {
        return ResponseEntity.ok(galleryService.publishAlbum(albumId, true));
    }

    @PatchMapping("/albums/{albumId}/unpublish")
    public ResponseEntity<GalleryAlbumResponse> unpublishAlbum(@PathVariable Long albumId) {
        return ResponseEntity.ok(galleryService.publishAlbum(albumId, false));
    }

    @DeleteMapping("/albums/{albumId}")
    public ResponseEntity<Void> deleteAlbum(@PathVariable Long albumId) {
        galleryService.deleteAlbum(albumId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/albums/{albumId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<GalleryImageResponse>> uploadImages(
            @PathVariable Long albumId,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(galleryService.uploadImages(albumId, files));
    }

    @PutMapping("/albums/{albumId}/images/order")
    public ResponseEntity<List<GalleryImageResponse>> reorderImages(
            @PathVariable Long albumId,
            @Valid @RequestBody GalleryImageOrderRequest request) {
        return ResponseEntity.ok(galleryService.reorderImages(albumId, request));
    }

    @PutMapping("/images/{imageId}")
    public ResponseEntity<GalleryImageResponse> updateImage(
            @PathVariable Long imageId,
            @Valid @RequestBody GalleryImageMetadataRequest request) {
        return ResponseEntity.ok(galleryService.updateImage(imageId, request));
    }

    @PatchMapping("/images/{imageId}/publish")
    public ResponseEntity<GalleryImageResponse> publishImage(@PathVariable Long imageId) {
        return ResponseEntity.ok(galleryService.publishImage(imageId, true));
    }

    @PatchMapping("/images/{imageId}/unpublish")
    public ResponseEntity<GalleryImageResponse> unpublishImage(@PathVariable Long imageId) {
        return ResponseEntity.ok(galleryService.publishImage(imageId, false));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        galleryService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/associations")
    public ResponseEntity<AdminGalleryAssociationPageResponse> getAssociationOptions(
            @RequestParam GalleryAssociationType type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "100") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(galleryService.getAssociationOptions(type, search, page, size));
    }
}
