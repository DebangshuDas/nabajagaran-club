package com.nabajaran.api.repository;

import com.nabajaran.api.entity.MembershipApplication;
import com.nabajaran.api.enums.ApprovalStatus;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MembershipApplicationRepository extends JpaRepository<MembershipApplication, Long> {

    boolean existsByEmailIgnoreCaseAndStatusAndDeletedFalse(String email, ApprovalStatus status);

    Optional<MembershipApplication> findByIdAndDeletedFalse(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM MembershipApplication a WHERE a.id = :id AND a.deleted = false")
    Optional<MembershipApplication> findForReview(@Param("id") Long id);

    @Query("""
            SELECT a FROM MembershipApplication a
            WHERE a.deleted = false
              AND (:status IS NULL OR a.status = :status)
              AND (:search = '' OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(a.email) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<MembershipApplication> findAdminPage(
            @Param("search") String search,
            @Param("status") ApprovalStatus status,
            Pageable pageable);
}
