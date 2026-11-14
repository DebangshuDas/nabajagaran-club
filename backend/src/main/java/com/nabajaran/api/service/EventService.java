package com.nabajaran.api.service;

import com.nabajaran.api.dto.EventResponse;
import com.nabajaran.api.entity.Event;
import com.nabajaran.api.enums.EventStatus;
import com.nabajaran.api.repository.EventRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findByStatusAndPublishedTrueAndDeletedFalseOrderByStartAtAsc(EventStatus.UPCOMING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getSlug(),
                event.getDescription(),
                event.getShortDescription(),
                event.getEventType(),
                event.getStatus().name(),
                event.getStartAt(),
                event.getEndAt(),
                event.getVenue(),
                event.getAddress(),
                event.isPublished(),
                event.getCapacity(),
                event.getImageUrl(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
