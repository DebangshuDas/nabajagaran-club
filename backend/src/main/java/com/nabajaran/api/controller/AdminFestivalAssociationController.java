package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminFestivalAssociationPageResponse;
import com.nabajaran.api.enums.FestivalAssociationType;
import com.nabajaran.api.service.FestivalAssociationService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/festival-associations")
public class AdminFestivalAssociationController {

    private final FestivalAssociationService associationService;

    public AdminFestivalAssociationController(FestivalAssociationService associationService) {
        this.associationService = associationService;
    }

    @GetMapping
    public ResponseEntity<AdminFestivalAssociationPageResponse> getOptions(
            @RequestParam FestivalAssociationType type,
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "100") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(associationService.getOptions(type, search, page, size));
    }
}
