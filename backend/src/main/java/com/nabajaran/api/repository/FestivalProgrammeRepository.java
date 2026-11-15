package com.nabajaran.api.repository;

import com.nabajaran.api.entity.FestivalProgramme;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FestivalProgrammeRepository extends JpaRepository<FestivalProgramme, Long> {

    @EntityGraph(attributePaths = "festivalEdition")
    List<FestivalProgramme> findByFestivalEdition_IdAndDeletedFalseOrderByProgrammeDateAscDisplayOrderAscStartTimeAscIdAsc(
            Long festivalEditionId);

    @EntityGraph(attributePaths = "festivalEdition")
    List<FestivalProgramme> findByFestivalEdition_IdAndProgrammeDateAndDeletedFalseOrderByDisplayOrderAscStartTimeAscIdAsc(
            Long festivalEditionId,
            LocalDate programmeDate);

    @EntityGraph(attributePaths = "festivalEdition")
    List<FestivalProgramme> findByFestivalEdition_IdAndPublishedTrueAndDeletedFalseOrderByProgrammeDateAscDisplayOrderAscStartTimeAscIdAsc(
            Long festivalEditionId);

    Optional<FestivalProgramme> findByIdAndFestivalEdition_IdAndDeletedFalse(Long id, Long festivalEditionId);
}
