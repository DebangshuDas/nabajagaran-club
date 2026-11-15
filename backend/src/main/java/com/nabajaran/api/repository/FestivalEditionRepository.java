package com.nabajaran.api.repository;

import com.nabajaran.api.entity.FestivalEdition;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FestivalEditionRepository extends
        JpaRepository<FestivalEdition, Long>,
        JpaSpecificationExecutor<FestivalEdition> {

    Optional<FestivalEdition> findByIdAndFestival_IdAndDeletedFalse(Long id, Long festivalId);

    @EntityGraph(attributePaths = {"scheduledEvents", "galleryImages", "sponsors"})
    List<FestivalEdition> findByFestival_IdAndPublishedTrueAndDeletedFalseOrderByYearDesc(Long festivalId);

    boolean existsByFestival_IdAndYearAndDeletedFalse(Long festivalId, Integer year);

    boolean existsByFestival_IdAndYearAndDeletedFalseAndIdNot(Long festivalId, Integer year, Long id);

    boolean existsByFestival_Id(Long festivalId);
}
