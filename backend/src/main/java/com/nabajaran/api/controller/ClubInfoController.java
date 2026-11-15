package com.nabajaran.api.controller;

import com.nabajaran.api.dto.ClubInfoResponse;
import com.nabajaran.api.dto.ClubProfileUpdateRequest;
import jakarta.validation.Valid;
import com.nabajaran.api.service.ClubInfoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ClubInfoController {

    private final ClubInfoService clubInfoService;

    public ClubInfoController(ClubInfoService clubInfoService) {
        this.clubInfoService = clubInfoService;
    }

    @GetMapping("/club")
    public ResponseEntity<ClubInfoResponse> getClubDetails() {
        return ResponseEntity.ok(clubInfoService.getClubDetails());
    }

    @PutMapping("/admin/club")
    public ResponseEntity<ClubInfoResponse> updateClubProfile(
            @Valid @RequestBody ClubProfileUpdateRequest request) {
        return ResponseEntity.ok(clubInfoService.updateClubProfile(request));
    }
}
