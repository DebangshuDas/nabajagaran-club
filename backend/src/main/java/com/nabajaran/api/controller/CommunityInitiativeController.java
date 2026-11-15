package com.nabajaran.api.controller;

import com.nabajaran.api.dto.CommunityInitiativeResponse;
import com.nabajaran.api.service.CommunityInitiativeService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/initiatives")
public class CommunityInitiativeController {

    private final CommunityInitiativeService initiativeService;

    public CommunityInitiativeController(CommunityInitiativeService initiativeService) {
        this.initiativeService = initiativeService;
    }

    @GetMapping("/published")
    public ResponseEntity<List<CommunityInitiativeResponse>> getPublishedInitiatives() {
        return ResponseEntity.ok(initiativeService.getPublishedInitiatives());
    }
}
