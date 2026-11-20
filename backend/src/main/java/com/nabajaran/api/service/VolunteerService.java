package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminPageResponse;
import com.nabajaran.api.dto.ReviewRequest;
import com.nabajaran.api.dto.SubmissionReceiptResponse;
import com.nabajaran.api.dto.VolunteerAdminResponse;
import com.nabajaran.api.dto.VolunteerRegistrationAdminResponse;
import com.nabajaran.api.dto.VolunteerRegistrationSubmissionRequest;
import com.nabajaran.api.dto.VolunteerStatusUpdateRequest;
import com.nabajaran.api.entity.Volunteer;
import com.nabajaran.api.entity.VolunteerRegistration;
import com.nabajaran.api.enums.ApprovalStatus;
import com.nabajaran.api.enums.VolunteerStatus;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.InvalidRequestException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.VolunteerRegistrationRepository;
import com.nabajaran.api.repository.VolunteerRepository;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VolunteerService {

    private final VolunteerRegistrationRepository registrationRepository;
    private final VolunteerRepository volunteerRepository;

    public VolunteerService(
            VolunteerRegistrationRepository registrationRepository,
            VolunteerRepository volunteerRepository) {
        this.registrationRepository = registrationRepository;
        this.volunteerRepository = volunteerRepository;
    }

    @Transactional
    public SubmissionReceiptResponse submit(VolunteerRegistrationSubmissionRequest request) {
        if (hasHoneypotValue(request.companyWebsite())) {
            throw new InvalidRequestException("The registration could not be accepted.");
        }

        String email = normalizeEmail(request.email());
        if (registrationRepository.existsByEmailIgnoreCaseAndStatusAndDeletedFalse(
                email, ApprovalStatus.PENDING)) {
            throw new ConflictException("A volunteer registration with this email is already pending.");
        }

        VolunteerRegistration registration = new VolunteerRegistration();
        registration.setFullName(request.fullName().trim());
        registration.setEmail(email);
        registration.setPhone(trimToNull(request.phone()));
        registration.setPreferredRoles(trimToNull(request.preferredRoles()));
        registration.setAvailability(trimToNull(request.availability()));
        registration.setMotivation(trimToNull(request.motivation()));
        registration.setStatus(ApprovalStatus.PENDING);
        registration.setPendingEmail(email);
        try {
            registrationRepository.saveAndFlush(registration);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A matching volunteer registration is already pending.");
        }

        return new SubmissionReceiptResponse("Your volunteer registration has been received.");
    }

    @Transactional(readOnly = true)
    public AdminPageResponse<VolunteerRegistrationAdminResponse> getRegistrations(
            String search, ApprovalStatus status, int page, int size) {
        Page<VolunteerRegistration> result = registrationRepository.findAdminPage(
                normalizeSearch(search),
                status,
                pageRequest(page, size, "createdAt"));
        return mapPage(result, VolunteerService::toRegistrationResponse);
    }

    @Transactional(readOnly = true)
    public VolunteerRegistrationAdminResponse getRegistration(Long id) {
        return toRegistrationResponse(findRegistration(id));
    }

    @Transactional
    public VolunteerRegistrationAdminResponse approveRegistration(
            Long id, ReviewRequest request, String reviewer) {
        VolunteerRegistration registration = registrationRepository.findForReview(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer registration not found."));
        requirePending(registration.getStatus());
        if (volunteerRepository.existsByRegistration_Id(registration.getId())) {
            throw new ConflictException("A volunteer record already exists for this registration.");
        }

        LocalDateTime now = LocalDateTime.now();
        registration.setStatus(ApprovalStatus.APPROVED);
        registration.setPendingEmail(null);
        recordReview(registration, reviewer, request == null ? null : request.internalNotes(), now);

        Volunteer volunteer = new Volunteer();
        volunteer.setRegistration(registration);
        volunteer.setStatus(VolunteerStatus.ACTIVE);
        volunteer.setActivatedAt(now);
        try {
            volunteerRepository.saveAndFlush(volunteer);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A volunteer record already exists for this registration.");
        }
        return toRegistrationResponse(registration);
    }

    @Transactional
    public VolunteerRegistrationAdminResponse rejectRegistration(
            Long id, ReviewRequest request, String reviewer) {
        VolunteerRegistration registration = registrationRepository.findForReview(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer registration not found."));
        requirePending(registration.getStatus());
        registration.setStatus(ApprovalStatus.REJECTED);
        registration.setPendingEmail(null);
        recordReview(registration, reviewer, request == null ? null : request.internalNotes(), LocalDateTime.now());
        return toRegistrationResponse(registration);
    }

    @Transactional(readOnly = true)
    public AdminPageResponse<VolunteerAdminResponse> getVolunteers(
            String search, VolunteerStatus status, int page, int size) {
        Page<Volunteer> result = volunteerRepository.findAdminPage(
                normalizeSearch(search),
                status,
                pageRequest(page, size, "createdAt"));
        return mapPage(result, VolunteerService::toVolunteerResponse);
    }

    @Transactional(readOnly = true)
    public VolunteerAdminResponse getVolunteer(Long id) {
        Volunteer volunteer = volunteerRepository.findByIdAndDeletedFalse(id)
                .filter(item -> !item.getRegistration().isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found."));
        return toVolunteerResponse(volunteer);
    }

    @Transactional
    public VolunteerAdminResponse updateVolunteerStatus(Long id, VolunteerStatusUpdateRequest request) {
        Volunteer volunteer = volunteerRepository.findByIdAndDeletedFalse(id)
                .filter(item -> !item.getRegistration().isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found."));
        if (volunteer.getStatus() != request.status()) {
            volunteer.setStatus(request.status());
            if (request.status() == VolunteerStatus.INACTIVE) {
                volunteer.setDeactivatedAt(LocalDateTime.now());
            } else {
                if (volunteer.getActivatedAt() == null) {
                    volunteer.setActivatedAt(LocalDateTime.now());
                }
                volunteer.setDeactivatedAt(null);
            }
        }
        return toVolunteerResponse(volunteer);
    }

    private VolunteerRegistration findRegistration(Long id) {
        return registrationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer registration not found."));
    }

    private static void recordReview(
            VolunteerRegistration registration, String reviewer, String notes, LocalDateTime reviewedAt) {
        registration.setReviewedAt(reviewedAt);
        registration.setReviewedBy(reviewer);
        registration.setInternalNotes(trimToNull(notes));
    }

    private static void requirePending(ApprovalStatus status) {
        if (status != ApprovalStatus.PENDING) {
            throw new ConflictException("Only pending registrations can be reviewed.");
        }
    }

    private static VolunteerRegistrationAdminResponse toRegistrationResponse(
            VolunteerRegistration registration) {
        return new VolunteerRegistrationAdminResponse(
                registration.getId(),
                registration.getMember() == null ? null : registration.getMember().getId(),
                registration.getFullName(),
                registration.getEmail(),
                registration.getPhone(),
                registration.getPreferredRoles(),
                registration.getAvailability(),
                registration.getMotivation(),
                registration.getStatus(),
                registration.getReviewedAt(),
                registration.getReviewedBy(),
                registration.getInternalNotes(),
                registration.getCreatedAt(),
                registration.getUpdatedAt());
    }

    private static VolunteerAdminResponse toVolunteerResponse(Volunteer volunteer) {
        VolunteerRegistration registration = volunteer.getRegistration();
        return new VolunteerAdminResponse(
                volunteer.getId(),
                registration.getId(),
                registration.getMember() == null ? null : registration.getMember().getId(),
                registration.getFullName(),
                registration.getEmail(),
                registration.getPhone(),
                registration.getPreferredRoles(),
                registration.getAvailability(),
                volunteer.getStatus(),
                volunteer.getActivatedAt(),
                volunteer.getDeactivatedAt(),
                volunteer.getCreatedAt(),
                volunteer.getUpdatedAt());
    }

    private static <S, T> AdminPageResponse<T> mapPage(
            Page<S> page, java.util.function.Function<S, T> mapper) {
        return new AdminPageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    private static Pageable pageRequest(int page, int size, String sortProperty) {
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortProperty));
    }

    private static String normalizeSearch(String search) {
        return search == null ? "" : search.trim();
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static boolean hasHoneypotValue(String value) {
        return value != null && !value.isBlank();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
