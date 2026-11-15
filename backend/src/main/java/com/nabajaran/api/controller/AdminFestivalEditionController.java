package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminFestivalEditionPageResponse;
import com.nabajaran.api.dto.FestivalEditionRequest;
import com.nabajaran.api.dto.FestivalEditionResponse;
import com.nabajaran.api.service.FestivalEditionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/admin/festivals/{festivalId}/editions")
public class AdminFestivalEditionController {

    private final FestivalEditionService editionService;

    public AdminFestivalEditionController(FestivalEditionService editionService) {
        this.editionService = editionService;
    }

    @GetMapping
    public ResponseEntity<AdminFestivalEditionPageResponse> getEditions(
            @PathVariable @Positive Long festivalId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(editionService.getAdminEditions(festivalId, page, size));
    }

    @GetMapping("/{editionId}")
    public ResponseEntity<FestivalEditionResponse> getEdition(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId) {
        return ResponseEntity.ok(editionService.getAdminEdition(festivalId, editionId));
    }

    @PostMapping
    public ResponseEntity<FestivalEditionResponse> createEdition(
            @PathVariable @Positive Long festivalId,
            @Valid @RequestBody FestivalEditionRequest request) {
        FestivalEditionResponse edition = editionService.createEdition(festivalId, request);
        return ResponseEntity.created(URI.create(
                "/api/v1/admin/festivals/" + festivalId + "/editions/" + edition.id()))
                .body(edition);
    }

    @PutMapping("/{editionId}")
    public ResponseEntity<FestivalEditionResponse> updateEdition(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @Valid @RequestBody FestivalEditionRequest request) {
        return ResponseEntity.ok(editionService.updateEdition(festivalId, editionId, request));
    }

    @PatchMapping("/{editionId}/publish")
    public ResponseEntity<FestivalEditionResponse> publishEdition(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId) {
        return ResponseEntity.ok(editionService.publishEdition(festivalId, editionId));
    }

    @PatchMapping("/{editionId}/unpublish")
    public ResponseEntity<FestivalEditionResponse> unpublishEdition(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId) {
        return ResponseEntity.ok(editionService.unpublishEdition(festivalId, editionId));
    }

    @DeleteMapping("/{editionId}")
    public ResponseEntity<Void> deleteEdition(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId) {
        editionService.deleteEdition(festivalId, editionId);
        return ResponseEntity.noContent().build();
    }
}
