package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminCommunityInitiativePageResponse;
import com.nabajaran.api.dto.CommunityInitiativeRequest;
import com.nabajaran.api.dto.CommunityInitiativeResponse;
import com.nabajaran.api.service.CommunityInitiativeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.net.URI;
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

@Validated
@RestController
@RequestMapping("/api/v1/admin/initiatives")
public class AdminCommunityInitiativeController {

    private final CommunityInitiativeService initiativeService;

    public AdminCommunityInitiativeController(CommunityInitiativeService initiativeService) {
        this.initiativeService = initiativeService;
    }

    @GetMapping
    public ResponseEntity<AdminCommunityInitiativePageResponse> getInitiatives(
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(required = false) @Size(max = 100) String category,
            @RequestParam(required = false)
            @Pattern(regexp = "PLANNED|ACTIVE|COMPLETED", message = "Status filter is invalid.") String status,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(initiativeService.getAdminInitiatives(
                search, category, status, published, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommunityInitiativeResponse> getInitiative(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(initiativeService.getAdminInitiative(id));
    }

    @PostMapping
    public ResponseEntity<CommunityInitiativeResponse> createInitiative(
            @Valid @RequestBody CommunityInitiativeRequest request) {
        CommunityInitiativeResponse initiative = initiativeService.createInitiative(request);
        return ResponseEntity.created(URI.create("/api/v1/admin/initiatives/" + initiative.id()))
                .body(initiative);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommunityInitiativeResponse> updateInitiative(
            @PathVariable @Positive Long id,
            @Valid @RequestBody CommunityInitiativeRequest request) {
        return ResponseEntity.ok(initiativeService.updateInitiative(id, request));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<CommunityInitiativeResponse> publishInitiative(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(initiativeService.publishInitiative(id));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<CommunityInitiativeResponse> unpublishInitiative(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(initiativeService.unpublishInitiative(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInitiative(@PathVariable @Positive Long id) {
        initiativeService.deleteInitiative(id);
        return ResponseEntity.noContent().build();
    }
}
