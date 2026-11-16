package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Event;
import com.nabajaran.api.enums.EventStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    List<Event> findByStatusAndPublishedTrueAndDeletedFalseOrderByStartAtAsc(EventStatus status);

    List<Event> findByPublishedTrueAndDeletedFalseOrderByStartAtAscIdAsc();

    Optional<Event> findByIdAndDeletedFalse(Long id);

    List<Event> findAllByIdInAndDeletedFalse(List<Long> ids);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
