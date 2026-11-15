package com.nabajaran.api.service;

import com.nabajaran.api.dto.FestivalProgrammeRequest;
import com.nabajaran.api.dto.FestivalProgrammeResponse;
import com.nabajaran.api.dto.FestivalProgrammeReorderRequest;
import com.nabajaran.api.entity.Festival;
import com.nabajaran.api.entity.FestivalEdition;
import com.nabajaran.api.entity.FestivalProgramme;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.FestivalEditionRepository;
import com.nabajaran.api.repository.FestivalProgrammeRepository;
import com.nabajaran.api.repository.FestivalRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FestivalProgrammeService {

    private final FestivalProgrammeRepository programmeRepository;
    private final FestivalRepository festivalRepository;
    private final FestivalEditionRepository editionRepository;

    public FestivalProgrammeService(
            FestivalProgrammeRepository programmeRepository,
            FestivalRepository festivalRepository,
            FestivalEditionRepository editionRepository) {
        this.programmeRepository = programmeRepository;
        this.festivalRepository = festivalRepository;
        this.editionRepository = editionRepository;
    }

    @Transactional(readOnly = true)
    public List<FestivalProgrammeResponse> getAdminProgrammes(Long festivalId, Long editionId, LocalDate date) {
        findActiveEdition(festivalId, editionId);
        List<FestivalProgramme> programmes = date == null
                ? programmeRepository
                        .findByFestivalEdition_IdAndDeletedFalseOrderByProgrammeDateAscDisplayOrderAscStartTimeAscIdAsc(
                                editionId)
                : programmeRepository
                        .findByFestivalEdition_IdAndProgrammeDateAndDeletedFalseOrderByDisplayOrderAscStartTimeAscIdAsc(
                                editionId, date);
        return programmes.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FestivalProgrammeResponse getAdminProgramme(Long festivalId, Long editionId, Long programmeId) {
        findActiveEdition(festivalId, editionId);
        return toResponse(findActiveProgramme(editionId, programmeId));
    }

    @Transactional
    public FestivalProgrammeResponse createProgramme(
            Long festivalId,
            Long editionId,
            FestivalProgrammeRequest request) {
        FestivalEdition edition = findActiveEdition(festivalId, editionId);
        FestivalProgramme programme = new FestivalProgramme();
        programme.setFestivalEdition(edition);
        applyRequest(programme, request);
        return toResponse(programmeRepository.saveAndFlush(programme));
    }

    @Transactional
    public FestivalProgrammeResponse updateProgramme(
            Long festivalId,
            Long editionId,
            Long programmeId,
            FestivalProgrammeRequest request) {
        findActiveEdition(festivalId, editionId);
        FestivalProgramme programme = findActiveProgramme(editionId, programmeId);
        applyRequest(programme, request);
        return toResponse(programmeRepository.saveAndFlush(programme));
    }

    @Transactional
    public List<FestivalProgrammeResponse> reorderProgrammes(
            Long festivalId,
            Long editionId,
            FestivalProgrammeReorderRequest request) {
        findActiveEdition(festivalId, editionId);
        List<FestivalProgramme> dayProgrammes =
                programmeRepository
                        .findByFestivalEdition_IdAndProgrammeDateAndDeletedFalseOrderByDisplayOrderAscStartTimeAscIdAsc(
                                editionId, request.programmeDate());
        List<Long> requestedIds = request.programmeIds();
        Set<Long> uniqueRequestedIds = new HashSet<>(requestedIds);
        Set<Long> actualIds = dayProgrammes.stream()
                .map(FestivalProgramme::getId)
                .collect(java.util.stream.Collectors.toSet());
        if (uniqueRequestedIds.size() != requestedIds.size()
                || !actualIds.equals(uniqueRequestedIds)
                || dayProgrammes.size() != requestedIds.size()) {
            throw new ConflictException("Reordering must include every active programme for the selected date once.");
        }

        var programmesById = dayProgrammes.stream()
                .collect(java.util.stream.Collectors.toMap(FestivalProgramme::getId, programme -> programme));
        List<FestivalProgramme> reorderedProgrammes = requestedIds.stream()
                .map(programmesById::get)
                .toList();
        for (int order = 0; order < requestedIds.size(); order++) {
            reorderedProgrammes.get(order).setDisplayOrder(order);
        }
        programmeRepository.saveAllAndFlush(reorderedProgrammes);
        return reorderedProgrammes.stream().map(this::toResponse).toList();
    }

    @Transactional
    public FestivalProgrammeResponse publishProgramme(Long festivalId, Long editionId, Long programmeId) {
        return setPublished(festivalId, editionId, programmeId, true);
    }

    @Transactional
    public FestivalProgrammeResponse unpublishProgramme(Long festivalId, Long editionId, Long programmeId) {
        return setPublished(festivalId, editionId, programmeId, false);
    }

    @Transactional
    public void deleteProgramme(Long festivalId, Long editionId, Long programmeId) {
        findActiveEdition(festivalId, editionId);
        FestivalProgramme programme = findActiveProgramme(editionId, programmeId);
        programme.setDeleted(true);
        programme.setDeletedAt(LocalDateTime.now());
        programmeRepository.save(programme);
    }

    private FestivalProgrammeResponse setPublished(
            Long festivalId,
            Long editionId,
            Long programmeId,
            boolean published) {
        findActiveEdition(festivalId, editionId);
        FestivalProgramme programme = findActiveProgramme(editionId, programmeId);
        programme.setPublished(published);
        return toResponse(programmeRepository.saveAndFlush(programme));
    }

    private Festival findActiveFestival(Long festivalId) {
        return festivalRepository.findByIdAndDeletedFalse(festivalId)
                .orElseThrow(() -> new ResourceNotFoundException("Festival not found."));
    }

    private FestivalEdition findActiveEdition(Long festivalId, Long editionId) {
        findActiveFestival(festivalId);
        return editionRepository.findByIdAndFestival_IdAndDeletedFalse(editionId, festivalId)
                .orElseThrow(() -> new ResourceNotFoundException("Festival edition not found."));
    }

    private FestivalProgramme findActiveProgramme(Long editionId, Long programmeId) {
        return programmeRepository.findByIdAndFestivalEdition_IdAndDeletedFalse(programmeId, editionId)
                .orElseThrow(() -> new ResourceNotFoundException("Festival programme not found."));
    }

    private void applyRequest(FestivalProgramme programme, FestivalProgrammeRequest request) {
        programme.setTitle(request.title().trim());
        programme.setDescription(cleanOptional(request.description()));
        programme.setProgrammeDate(request.programmeDate());
        programme.setStartTime(request.startTime());
        programme.setEndTime(request.endTime());
        programme.setVenue(cleanOptional(request.venue()));
        programme.setDisplayOrder(request.displayOrder());
        programme.setPublished(request.published());
    }

    private FestivalProgrammeResponse toResponse(FestivalProgramme programme) {
        return new FestivalProgrammeResponse(
                programme.getId(),
                programme.getFestivalEdition().getId(),
                programme.getFestivalEdition().getYear(),
                programme.getTitle(),
                programme.getDescription(),
                programme.getProgrammeDate(),
                programme.getStartTime(),
                programme.getEndTime(),
                programme.getVenue(),
                programme.getDisplayOrder(),
                programme.isPublished(),
                programme.getCreatedAt(),
                programme.getUpdatedAt());
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
