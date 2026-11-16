package com.nabajaran.api.repository;

import com.nabajaran.api.entity.CommunityInitiative;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunityInitiativeRepository extends
        JpaRepository<CommunityInitiative, Long>,
        JpaSpecificationExecutor<CommunityInitiative> {

    Optional<CommunityInitiative> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = "relatedEvents")
    List<CommunityInitiative> findByPublishedTrueAndDeletedFalseOrderByStartDateAscIdAsc();

    List<CommunityInitiative> findByPublishedTrueAndDeletedFalseOrderByTitleAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
