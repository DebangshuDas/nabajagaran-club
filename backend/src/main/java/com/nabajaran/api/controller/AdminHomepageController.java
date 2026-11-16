package com.nabajaran.api.controller;

import com.nabajaran.api.dto.HomepageAdminResponse;
import com.nabajaran.api.dto.HomepageUpdateRequest;
import com.nabajaran.api.service.HomepageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/homepage")
public class AdminHomepageController {

    private final HomepageService homepageService;

    public AdminHomepageController(HomepageService homepageService) {
        this.homepageService = homepageService;
    }

    @GetMapping
    public ResponseEntity<HomepageAdminResponse> getHomepage() {
        return ResponseEntity.ok(homepageService.getAdminHomepage());
    }

    @PutMapping
    public ResponseEntity<HomepageAdminResponse> updateHomepage(
            @Valid @RequestBody HomepageUpdateRequest request) {
        return ResponseEntity.ok(homepageService.updateHomepage(request));
    }
}
