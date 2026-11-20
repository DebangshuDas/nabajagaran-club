package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminPageResponse;
import com.nabajaran.api.dto.ReviewRequest;
import com.nabajaran.api.dto.VolunteerAdminResponse;
import com.nabajaran.api.dto.VolunteerRegistrationAdminResponse;
import com.nabajaran.api.dto.VolunteerStatusUpdateRequest;
import com.nabajaran.api.enums.ApprovalStatus;
import com.nabajaran.api.enums.VolunteerStatus;
import com.nabajaran.api.service.VolunteerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
public class AdminVolunteerController {

    private final VolunteerService volunteerService;

    public AdminVolunteerController(VolunteerService volunteerService) {
        this.volunteerService = volunteerService;
    }

    @GetMapping("/volunteer-registrations")
    public ResponseEntity<AdminPageResponse<VolunteerRegistrationAdminResponse>> getRegistrations(
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(required = false) ApprovalStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(volunteerService.getRegistrations(search, status, page, size));
    }

    @GetMapping("/volunteer-registrations/{id}")
    public ResponseEntity<VolunteerRegistrationAdminResponse> getRegistration(
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(volunteerService.getRegistration(id));
    }

    @PatchMapping("/volunteer-registrations/{id}/approve")
    public ResponseEntity<VolunteerRegistrationAdminResponse> approveRegistration(
            @PathVariable @Positive Long id,
            @Valid @RequestBody(required = false) ReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(volunteerService.approveRegistration(
                id, request, authentication.getName()));
    }

    @PatchMapping("/volunteer-registrations/{id}/reject")
    public ResponseEntity<VolunteerRegistrationAdminResponse> rejectRegistration(
            @PathVariable @Positive Long id,
            @Valid @RequestBody(required = false) ReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(volunteerService.rejectRegistration(
                id, request, authentication.getName()));
    }

    @GetMapping("/volunteers")
    public ResponseEntity<AdminPageResponse<VolunteerAdminResponse>> getVolunteers(
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(required = false) VolunteerStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(volunteerService.getVolunteers(search, status, page, size));
    }

    @GetMapping("/volunteers/{id}")
    public ResponseEntity<VolunteerAdminResponse> getVolunteer(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(volunteerService.getVolunteer(id));
    }

    @PatchMapping("/volunteers/{id}/status")
    public ResponseEntity<VolunteerAdminResponse> updateVolunteerStatus(
            @PathVariable @Positive Long id,
            @Valid @RequestBody VolunteerStatusUpdateRequest request) {
        return ResponseEntity.ok(volunteerService.updateVolunteerStatus(id, request));
    }
}
