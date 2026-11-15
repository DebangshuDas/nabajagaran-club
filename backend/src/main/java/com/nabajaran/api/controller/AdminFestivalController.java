package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminFestivalPageResponse;
import com.nabajaran.api.dto.FestivalRequest;
import com.nabajaran.api.dto.FestivalResponse;
import com.nabajaran.api.service.FestivalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@RequestMapping("/api/v1/admin/festivals")
public class AdminFestivalController {

    private final FestivalService festivalService;

    public AdminFestivalController(FestivalService festivalService) {
        this.festivalService = festivalService;
    }

    @GetMapping
    public ResponseEntity<AdminFestivalPageResponse> getFestivals(
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(festivalService.getAdminFestivals(search, published, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FestivalResponse> getFestival(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(festivalService.getAdminFestival(id));
    }

    @PostMapping
    public ResponseEntity<FestivalResponse> createFestival(@Valid @RequestBody FestivalRequest request) {
        FestivalResponse festival = festivalService.createFestival(request);
        return ResponseEntity.created(URI.create("/api/v1/admin/festivals/" + festival.id())).body(festival);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FestivalResponse> updateFestival(
            @PathVariable @Positive Long id,
            @Valid @RequestBody FestivalRequest request) {
        return ResponseEntity.ok(festivalService.updateFestival(id, request));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<FestivalResponse> publishFestival(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(festivalService.publishFestival(id));
    }

    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<FestivalResponse> unpublishFestival(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(festivalService.unpublishFestival(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFestival(@PathVariable @Positive Long id) {
        festivalService.deleteFestival(id);
        return ResponseEntity.noContent().build();
    }
}
