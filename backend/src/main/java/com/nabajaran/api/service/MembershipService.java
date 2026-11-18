package com.nabajaran.api.service;

import com.nabajaran.api.dto.AdminPageResponse;
import com.nabajaran.api.dto.MemberAdminResponse;
import com.nabajaran.api.dto.MembershipApplicationAdminResponse;
import com.nabajaran.api.dto.MembershipApplicationSubmissionRequest;
import com.nabajaran.api.dto.MembershipApprovalRequest;
import com.nabajaran.api.dto.ReviewRequest;
import com.nabajaran.api.dto.SubmissionReceiptResponse;
import com.nabajaran.api.entity.Member;
import com.nabajaran.api.entity.MembershipApplication;
import com.nabajaran.api.enums.ApprovalStatus;
import com.nabajaran.api.enums.MembershipStatus;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.InvalidRequestException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.repository.MemberRepository;
import com.nabajaran.api.repository.MembershipApplicationRepository;
import org.springframework.dao.DataIntegrityViolationException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MembershipService {

    private final MembershipApplicationRepository applicationRepository;
    private final MemberRepository memberRepository;

    public MembershipService(
            MembershipApplicationRepository applicationRepository,
            MemberRepository memberRepository) {
        this.applicationRepository = applicationRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public SubmissionReceiptResponse submit(MembershipApplicationSubmissionRequest request) {
        if (hasHoneypotValue(request.companyWebsite())) {
            throw new InvalidRequestException("The application could not be accepted.");
        }

        String email = normalizeEmail(request.email());
        if (applicationRepository.existsByEmailIgnoreCaseAndStatusAndDeletedFalse(
                email, ApprovalStatus.PENDING)) {
            throw new ConflictException("An application with this email is already pending.");
        }

        MembershipApplication application = new MembershipApplication();
        application.setFullName(request.fullName().trim());
        application.setEmail(email);
        application.setPhone(trimToNull(request.phone()));
        application.setAddress(trimToNull(request.address()));
        application.setOccupation(trimToNull(request.occupation()));
        application.setReasonForJoining(trimToNull(request.reasonForJoining()));
        application.setAdditionalMessage(trimToNull(request.additionalMessage()));
        application.setStatus(ApprovalStatus.PENDING);
        application.setPendingEmail(email);
        application.setSubmittedAt(LocalDateTime.now());
        try {
            applicationRepository.saveAndFlush(application);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A matching application is already pending.");
        }

        return new SubmissionReceiptResponse("Your application has been received.");
    }

    @Transactional(readOnly = true)
    public AdminPageResponse<MembershipApplicationAdminResponse> getApplications(
            String search, ApprovalStatus status, int page, int size) {
        Page<MembershipApplication> result = applicationRepository.findAdminPage(
                normalizeSearch(search),
                status,
                pageRequest(page, size, "submittedAt"));
        return mapPage(result, MembershipService::toApplicationResponse);
    }

    @Transactional(readOnly = true)
    public MembershipApplicationAdminResponse getApplication(Long id) {
        return toApplicationResponse(findApplication(id));
    }

    @Transactional
    public MembershipApplicationAdminResponse approve(
            Long id, MembershipApprovalRequest request, String reviewer) {
        MembershipApplication application = applicationRepository.findForReview(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membership application not found."));
        requirePending(application.getStatus());

        if (memberRepository.existsByEmailIgnoreCase(application.getEmail())) {
            throw new ConflictException("A member record already uses this email address.");
        }

        Member member = new Member();
        member.setFirstName(request.firstName().trim());
        member.setLastName(request.lastName().trim());
        member.setEmail(application.getEmail());
        member.setPhone(application.getPhone());
        member.setMembershipStatus(MembershipStatus.ACTIVE);
        member.setJoinDate(LocalDate.now());
        member.setPublicProfile(false);
        Member savedMember;
        try {
            savedMember = memberRepository.saveAndFlush(member);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A member record already uses this email address.");
        }

        application.setMember(savedMember);
        application.setStatus(ApprovalStatus.APPROVED);
        application.setPendingEmail(null);
        recordReview(application, reviewer, request.internalNotes());
        return toApplicationResponse(application);
    }

    @Transactional
    public MembershipApplicationAdminResponse reject(Long id, ReviewRequest request, String reviewer) {
        MembershipApplication application = applicationRepository.findForReview(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membership application not found."));
        requirePending(application.getStatus());
        application.setStatus(ApprovalStatus.REJECTED);
        application.setPendingEmail(null);
        recordReview(application, reviewer, request == null ? null : request.internalNotes());
        return toApplicationResponse(application);
    }

    @Transactional(readOnly = true)
    public AdminPageResponse<MemberAdminResponse> getMembers(
            String search, MembershipStatus status, int page, int size) {
        Page<Member> result = memberRepository.findAdminPage(
                normalizeSearch(search),
                status,
                pageRequest(page, size, "createdAt"));
        return mapPage(result, MembershipService::toMemberResponse);
    }

    @Transactional(readOnly = true)
    public MemberAdminResponse getMember(Long id) {
        Member member = memberRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found."));
        return toMemberResponse(member);
    }

    private MembershipApplication findApplication(Long id) {
        return applicationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membership application not found."));
    }

    private void recordReview(MembershipApplication application, String reviewer, String notes) {
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(reviewer);
        application.setInternalNotes(trimToNull(notes));
    }

    private static void requirePending(ApprovalStatus status) {
        if (status != ApprovalStatus.PENDING) {
            throw new ConflictException("Only pending applications can be reviewed.");
        }
    }

    private static MembershipApplicationAdminResponse toApplicationResponse(
            MembershipApplication application) {
        return new MembershipApplicationAdminResponse(
                application.getId(),
                application.getFullName(),
                application.getEmail(),
                application.getPhone(),
                application.getAddress(),
                application.getOccupation(),
                application.getReasonForJoining(),
                application.getAdditionalMessage(),
                application.getStatus(),
                application.getMember() == null ? null : application.getMember().getId(),
                application.getSubmittedAt(),
                application.getReviewedAt(),
                application.getReviewedBy(),
                application.getInternalNotes(),
                application.getCreatedAt(),
                application.getUpdatedAt());
    }

    private static MemberAdminResponse toMemberResponse(Member member) {
        return new MemberAdminResponse(
                member.getId(),
                member.getFirstName(),
                member.getLastName(),
                member.getEmail(),
                member.getPhone(),
                member.getMembershipStatus(),
                member.getJoinDate(),
                member.getExpiryDate(),
                member.getNotes(),
                member.getCreatedAt(),
                member.getUpdatedAt());
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
