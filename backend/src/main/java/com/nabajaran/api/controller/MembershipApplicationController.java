package com.nabajaran.api.controller;

import com.nabajaran.api.dto.MembershipApplicationSubmissionRequest;
import com.nabajaran.api.dto.SubmissionReceiptResponse;
import com.nabajaran.api.service.MembershipService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/membership-applications")
public class MembershipApplicationController {

    private final MembershipService membershipService;

    public MembershipApplicationController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @PostMapping
    public ResponseEntity<SubmissionReceiptResponse> submitApplication(
            @Valid @RequestBody MembershipApplicationSubmissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(membershipService.submit(request));
    }
}
