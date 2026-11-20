package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Volunteer;
import com.nabajaran.api.enums.VolunteerStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {

    Optional<Volunteer> findByIdAndDeletedFalse(Long id);

    boolean existsByRegistration_Id(Long registrationId);

    @EntityGraph(attributePaths = "registration")
    @Query("""
            SELECT v FROM Volunteer v
            JOIN v.registration r
            WHERE v.deleted = false
              AND r.deleted = false
              AND (:status IS NULL OR v.status = :status)
              AND (:search = '' OR LOWER(r.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(r.email) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Volunteer> findAdminPage(
            @Param("search") String search,
            @Param("status") VolunteerStatus status,
            Pageable pageable);
}
