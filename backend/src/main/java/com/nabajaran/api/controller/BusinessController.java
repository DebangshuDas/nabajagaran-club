package com.nabajaran.api.controller;

import com.nabajaran.api.dto.BusinessResponse;
import com.nabajaran.api.service.BusinessService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class BusinessController {

    private final BusinessService businessService;

    public BusinessController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @GetMapping("/businesses/approved")
    public ResponseEntity<List<BusinessResponse>> getApprovedBusinesses() {
        return ResponseEntity.ok(businessService.getApprovedBusinesses());
    }
}
