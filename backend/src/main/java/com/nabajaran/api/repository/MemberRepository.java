package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Member;
import com.nabajaran.api.enums.MembershipStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Member> findByIdAndDeletedFalse(Long id);

    @Query("""
            SELECT m FROM Member m
            WHERE m.deleted = false
              AND (:status IS NULL OR m.membershipStatus = :status)
              AND (:search = '' OR
                   LOWER(CONCAT(CONCAT(COALESCE(m.firstName, ''), ' '), COALESCE(m.lastName, '')))
                       LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(m.email, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Member> findAdminPage(
            @Param("search") String search,
            @Param("status") MembershipStatus status,
            Pageable pageable);
}
