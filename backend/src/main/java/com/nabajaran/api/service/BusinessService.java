package com.nabajaran.api.service;

import com.nabajaran.api.dto.BusinessResponse;
import com.nabajaran.api.entity.Business;
import com.nabajaran.api.enums.ApprovalStatus;
import com.nabajaran.api.repository.BusinessRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessService {

    private final BusinessRepository businessRepository;

    public BusinessService(BusinessRepository businessRepository) {
        this.businessRepository = businessRepository;
    }

    @Transactional(readOnly = true)
    public List<BusinessResponse> getApprovedBusinesses() {
        return businessRepository.findByApprovalStatusAndActiveTrueAndDeletedFalseOrderByNameAsc(ApprovalStatus.APPROVED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private BusinessResponse toResponse(Business business) {
        return new BusinessResponse(
                business.getId(),
                business.getName(),
                business.getSlug(),
                business.getCategory() != null ? business.getCategory().getName() : null,
                business.getDescription(),
                business.getWebsite(),
                business.getEmail(),
                business.getPhone(),
                business.getAddress(),
                business.getCity(),
                business.getState(),
                business.getCountry(),
                business.getPostalCode(),
                business.getApprovalStatus().name(),
                business.isFeatured(),
                business.isActive(),
                business.getCreatedAt(),
                business.getUpdatedAt()
        );
    }
}
