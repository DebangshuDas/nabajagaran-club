package com.nabajaran.api.controller;

import com.nabajaran.api.dto.AdminPageResponse;
import com.nabajaran.api.dto.MemberAdminResponse;
import com.nabajaran.api.dto.MembershipApplicationAdminResponse;
import com.nabajaran.api.dto.MembershipApprovalRequest;
import com.nabajaran.api.dto.ReviewRequest;
import com.nabajaran.api.enums.ApprovalStatus;
import com.nabajaran.api.enums.MembershipStatus;
import com.nabajaran.api.service.MembershipService;
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
public class AdminMembershipController {

    private final MembershipService membershipService;

    public AdminMembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping("/membership-applications")
    public ResponseEntity<AdminPageResponse<MembershipApplicationAdminResponse>> getApplications(
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(required = false) ApprovalStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(membershipService.getApplications(search, status, page, size));
    }

    @GetMapping("/membership-applications/{id}")
    public ResponseEntity<MembershipApplicationAdminResponse> getApplication(
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(membershipService.getApplication(id));
    }

    @PatchMapping("/membership-applications/{id}/approve")
    public ResponseEntity<MembershipApplicationAdminResponse> approveApplication(
            @PathVariable @Positive Long id,
            @Valid @RequestBody MembershipApprovalRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                membershipService.approve(id, request, authentication.getName()));
    }

    @PatchMapping("/membership-applications/{id}/reject")
    public ResponseEntity<MembershipApplicationAdminResponse> rejectApplication(
            @PathVariable @Positive Long id,
            @Valid @RequestBody(required = false) ReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                membershipService.reject(id, request, authentication.getName()));
    }

    @GetMapping("/members")
    public ResponseEntity<AdminPageResponse<MemberAdminResponse>> getMembers(
            @RequestParam(defaultValue = "") @Size(max = 200) String search,
            @RequestParam(required = false) MembershipStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(membershipService.getMembers(search, status, page, size));
    }

    @GetMapping("/members/{id}")
    public ResponseEntity<MemberAdminResponse> getMember(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(membershipService.getMember(id));
    }
}
