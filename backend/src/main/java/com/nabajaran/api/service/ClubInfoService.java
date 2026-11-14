package com.nabajaran.api.service;

import com.nabajaran.api.dto.ClubInfoResponse;
import com.nabajaran.api.entity.ClubInformation;
import com.nabajaran.api.exception.ResourceNotFoundException;
import com.nabajaran.api.mapper.ClubInfoMapper;
import com.nabajaran.api.repository.ClubInformationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClubInfoService {

    private final ClubInformationRepository clubInformationRepository;
    private final ClubInfoMapper clubInfoMapper;

    public ClubInfoService(ClubInformationRepository clubInformationRepository, ClubInfoMapper clubInfoMapper) {
        this.clubInformationRepository = clubInformationRepository;
        this.clubInfoMapper = clubInfoMapper;
    }

    @Transactional(readOnly = true)
    public ClubInfoResponse getClubDetails() {
        ClubInformation clubInfo = clubInformationRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("Club information not found."));

        return clubInfoMapper.toResponse(clubInfo);
    }
}
