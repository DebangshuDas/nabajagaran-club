package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Festival;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FestivalRepository extends JpaRepository<Festival, Long>, JpaSpecificationExecutor<Festival> {

    Optional<Festival> findByIdAndDeletedFalse(Long id);

    Optional<Festival> findBySlugAndPublishedTrueAndDeletedFalse(String slug);

    List<Festival> findByPublishedTrueAndDeletedFalseOrderByNameAsc();

    List<Festival> findAllByIdInAndPublishedTrueAndDeletedFalse(List<Long> ids);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
