package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Business;
import com.nabajaran.api.enums.ApprovalStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessRepository extends JpaRepository<Business, Long> {

    List<Business> findByApprovalStatusAndActiveTrueAndDeletedFalseOrderByNameAsc(ApprovalStatus approvalStatus);
}
