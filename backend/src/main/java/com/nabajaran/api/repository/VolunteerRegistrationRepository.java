package com.nabajaran.api.repository;

import com.nabajaran.api.entity.VolunteerRegistration;
import com.nabajaran.api.enums.ApprovalStatus;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VolunteerRegistrationRepository extends JpaRepository<VolunteerRegistration, Long> {

    boolean existsByEmailIgnoreCaseAndStatusAndDeletedFalse(String email, ApprovalStatus status);

    Optional<VolunteerRegistration> findByIdAndDeletedFalse(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM VolunteerRegistration r WHERE r.id = :id AND r.deleted = false")
    Optional<VolunteerRegistration> findForReview(@Param("id") Long id);

    @Query("""
            SELECT r FROM VolunteerRegistration r
            WHERE r.deleted = false
              AND (:status IS NULL OR r.status = :status)
              AND (:search = '' OR LOWER(r.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(r.email) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<VolunteerRegistration> findAdminPage(
            @Param("search") String search,
            @Param("status") ApprovalStatus status,
            Pageable pageable);
}
