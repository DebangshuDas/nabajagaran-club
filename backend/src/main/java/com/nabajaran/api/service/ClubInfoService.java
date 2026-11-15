package com.nabajaran.api.service;

import com.nabajaran.api.dto.ClubInfoResponse;
import com.nabajaran.api.dto.ClubProfileUpdateRequest;
import com.nabajaran.api.entity.ClubInformation;
import com.nabajaran.api.exception.ConflictException;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.mapper.ClubInfoMapper;
import com.nabajaran.api.repository.ClubInformationRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClubInfoService {

    private final ClubInformationRepository clubInformationRepository;
    private final ClubInfoMapper clubInfoMapper;
    private final EntityManager entityManager;

    public ClubInfoService(
            ClubInformationRepository clubInformationRepository,
            ClubInfoMapper clubInfoMapper,
            EntityManager entityManager) {
        this.clubInformationRepository = clubInformationRepository;
        this.clubInfoMapper = clubInfoMapper;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public ClubInfoResponse getClubDetails() {
        return clubInfoMapper.toResponse(getActiveClubProfile());
    }

    @Transactional
    public ClubInfoResponse updateClubProfile(ClubProfileUpdateRequest request) {
        ClubInformation clubInfo = getActiveClubProfile();
        clubInfo.setName(request.clubName().trim());
        clubInfo.setTagline(cleanOptional(request.tagline()));
        clubInfo.setDescription(cleanOptional(request.description()));
        clubInfo.setMission(cleanOptional(request.mission()));
        clubInfo.setFoundingYear(request.foundedYear());
        clubInfo.setAddress(cleanOptional(request.address()));
        clubInfo.setCity(cleanOptional(request.city()));
        clubInfo.setState(cleanOptional(request.state()));
        clubInfo.setCountry(cleanOptional(request.country()));
        clubInfo.setPostalCode(cleanOptional(request.postalCode()));
        clubInfo.setEmail(cleanOptional(request.email()));
        clubInfo.setPhone(cleanOptional(request.phone()));
        clubInfo.setWebsite(cleanOptional(request.website()));
        clubInfo.setFacebookUrl(cleanOptional(request.facebookUrl()));
        clubInfo.setInstagramUrl(cleanOptional(request.instagramUrl()));

        try {
            ClubInformation savedClubInfo = clubInformationRepository.saveAndFlush(clubInfo);
            entityManager.refresh(savedClubInfo);
            return clubInfoMapper.toResponse(savedClubInfo);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("The club profile conflicts with existing data.");
        }
    }

    private ClubInformation getActiveClubProfile() {
        List<ClubInformation> activeProfiles =
                clubInformationRepository.findAllByDeletedFalseOrderByIdAsc();
        if (activeProfiles.isEmpty()) {
            throw new ResourceNotFoundException("Active club information not found.");
        }
        if (activeProfiles.size() > 1) {
            throw new ConflictException("Multiple active club profiles were found.");
        }
        return activeProfiles.get(0);
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
