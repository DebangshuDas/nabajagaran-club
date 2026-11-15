package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Sponsor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SponsorRepository extends JpaRepository<Sponsor, Long>, JpaSpecificationExecutor<Sponsor> {

    List<Sponsor> findAllByIdInAndDeletedFalse(List<Long> ids);
}
