package com.nabajaran.api.controller;

import com.nabajaran.api.dto.FestivalProgrammeRequest;
import com.nabajaran.api.dto.FestivalProgrammeResponse;
import com.nabajaran.api.dto.FestivalProgrammeReorderRequest;
import com.nabajaran.api.service.FestivalProgrammeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
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
@RequestMapping("/api/v1/admin/festivals/{festivalId}/editions/{editionId}/programmes")
public class AdminFestivalProgrammeController {

    private final FestivalProgrammeService programmeService;

    public AdminFestivalProgrammeController(FestivalProgrammeService programmeService) {
        this.programmeService = programmeService;
    }

    @GetMapping
    public ResponseEntity<List<FestivalProgrammeResponse>> getProgrammes(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(programmeService.getAdminProgrammes(festivalId, editionId, date));
    }

    @GetMapping("/{programmeId}")
    public ResponseEntity<FestivalProgrammeResponse> getProgramme(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @PathVariable @Positive Long programmeId) {
        return ResponseEntity.ok(programmeService.getAdminProgramme(festivalId, editionId, programmeId));
    }

    @PostMapping
    public ResponseEntity<FestivalProgrammeResponse> createProgramme(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @Valid @RequestBody FestivalProgrammeRequest request) {
        FestivalProgrammeResponse programme =
                programmeService.createProgramme(festivalId, editionId, request);
        return ResponseEntity.created(URI.create(
                "/api/v1/admin/festivals/" + festivalId + "/editions/" + editionId
                        + "/programmes/" + programme.id()))
                .body(programme);
    }

    @PutMapping("/{programmeId}")
    public ResponseEntity<FestivalProgrammeResponse> updateProgramme(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @PathVariable @Positive Long programmeId,
            @Valid @RequestBody FestivalProgrammeRequest request) {
        return ResponseEntity.ok(
                programmeService.updateProgramme(festivalId, editionId, programmeId, request));
    }

    @PutMapping("/order")
    public ResponseEntity<List<FestivalProgrammeResponse>> reorderProgrammes(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @Valid @RequestBody FestivalProgrammeReorderRequest request) {
        return ResponseEntity.ok(programmeService.reorderProgrammes(festivalId, editionId, request));
    }

    @PatchMapping("/{programmeId}/publish")
    public ResponseEntity<FestivalProgrammeResponse> publishProgramme(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @PathVariable @Positive Long programmeId) {
        return ResponseEntity.ok(
                programmeService.publishProgramme(festivalId, editionId, programmeId));
    }

    @PatchMapping("/{programmeId}/unpublish")
    public ResponseEntity<FestivalProgrammeResponse> unpublishProgramme(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @PathVariable @Positive Long programmeId) {
        return ResponseEntity.ok(
                programmeService.unpublishProgramme(festivalId, editionId, programmeId));
    }

    @DeleteMapping("/{programmeId}")
    public ResponseEntity<Void> deleteProgramme(
            @PathVariable @Positive Long festivalId,
            @PathVariable @Positive Long editionId,
            @PathVariable @Positive Long programmeId) {
        programmeService.deleteProgramme(festivalId, editionId, programmeId);
        return ResponseEntity.noContent().build();
    }
}
