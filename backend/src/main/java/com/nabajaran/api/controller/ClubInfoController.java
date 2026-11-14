package com.nabajaran.api.controller;

import com.nabajaran.api.dto.ClubInfoResponse;
import com.nabajaran.api.service.ClubInfoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
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
}
