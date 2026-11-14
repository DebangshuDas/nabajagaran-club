package com.nabajaran.api.repository;

import com.nabajaran.api.entity.ClubInfo;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubInfoRepository extends JpaRepository<ClubInfo, Long> {

    Optional<ClubInfo> findFirstByOrderByIdAsc();
}
