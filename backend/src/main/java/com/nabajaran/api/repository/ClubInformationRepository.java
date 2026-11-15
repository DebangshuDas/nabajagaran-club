package com.nabajaran.api.repository;

import com.nabajaran.api.entity.ClubInformation;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubInformationRepository extends JpaRepository<ClubInformation, Long> {

    Optional<ClubInformation> findFirstByOrderByIdAsc();

    Optional<ClubInformation> findFirstByDeletedFalseOrderByIdAsc();
}
