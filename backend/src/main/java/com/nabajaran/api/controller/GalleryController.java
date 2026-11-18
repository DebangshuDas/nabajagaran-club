package com.nabajaran.api.controller;

import com.nabajaran.api.dto.GalleryAlbumResponse;
import com.nabajaran.api.service.GalleryService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/gallery")
public class GalleryController {

    private final GalleryService galleryService;

    public GalleryController(GalleryService galleryService) {
        this.galleryService = galleryService;
    }

    @GetMapping("/albums")
    public ResponseEntity<List<GalleryAlbumResponse>> getPublishedAlbums(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(galleryService.getPublishedAlbums(category));
    }
}
