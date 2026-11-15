package com.nabajaran.api.controller;

import com.nabajaran.api.dto.FestivalPublicResponse;
import com.nabajaran.api.dto.FestivalPublicSummaryResponse;
import com.nabajaran.api.dto.FestivalResponse;
import com.nabajaran.api.service.FestivalService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/festivals")
public class FestivalController {

    private final FestivalService festivalService;

    public FestivalController(FestivalService festivalService) {
        this.festivalService = festivalService;
    }

    @GetMapping
    public ResponseEntity<List<FestivalPublicSummaryResponse>> getFestivalSummaries() {
        return ResponseEntity.ok(festivalService.getPublicFestivalSummaries());
    }

    @GetMapping("/published")
    public ResponseEntity<List<FestivalResponse>> getPublishedFestivals() {
        return ResponseEntity.ok(festivalService.getPublishedFestivals());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<FestivalPublicResponse> getPublishedFestival(@PathVariable String slug) {
        return ResponseEntity.ok(festivalService.getPublishedFestival(slug));
    }
}
