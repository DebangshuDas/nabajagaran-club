package com.nabajaran.api.controller;

import com.nabajaran.api.dto.SubmissionReceiptResponse;
import com.nabajaran.api.dto.VolunteerRegistrationSubmissionRequest;
import com.nabajaran.api.service.VolunteerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/volunteer-registrations")
public class VolunteerRegistrationController {

    private final VolunteerService volunteerService;

    public VolunteerRegistrationController(VolunteerService volunteerService) {
        this.volunteerService = volunteerService;
    }

    @PostMapping
    public ResponseEntity<SubmissionReceiptResponse> submitRegistration(
            @Valid @RequestBody VolunteerRegistrationSubmissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(volunteerService.submit(request));
    }
}
