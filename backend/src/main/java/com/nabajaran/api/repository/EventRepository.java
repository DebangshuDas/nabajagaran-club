package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Event;
import com.nabajaran.api.enums.EventStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatusAndPublishedTrueAndDeletedFalseOrderByStartAtAsc(EventStatus status);
}
