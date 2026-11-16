package com.nabajaran.api.controller;

import com.nabajaran.api.dto.HomepagePublicResponse;
import com.nabajaran.api.service.HomepageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/homepage")
public class HomepageController {

    private final HomepageService homepageService;

    public HomepageController(HomepageService homepageService) {
        this.homepageService = homepageService;
    }

    @GetMapping
    public ResponseEntity<HomepagePublicResponse> getHomepage() {
        return ResponseEntity.ok(homepageService.getPublicHomepage());
    }
}
