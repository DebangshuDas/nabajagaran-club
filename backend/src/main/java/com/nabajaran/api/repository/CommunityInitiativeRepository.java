package com.nabajaran.api.repository;

import com.nabajaran.api.entity.CommunityInitiative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunityInitiativeRepository extends JpaRepository<CommunityInitiative, Long> {
}
