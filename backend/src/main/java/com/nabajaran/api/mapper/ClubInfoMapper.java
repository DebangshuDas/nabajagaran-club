package com.nabajaran.api.mapper;

import com.nabajaran.api.dto.ClubInfoResponse;
import com.nabajaran.api.entity.ClubInformation;
import org.springframework.stereotype.Component;

@Component
public class ClubInfoMapper {

    public ClubInfoResponse toResponse(ClubInformation clubInfo) {
        return new ClubInfoResponse(
                clubInfo.getId(),
                clubInfo.getName(),
                clubInfo.getTagline(),
                clubInfo.getDescription(),
                clubInfo.getMission(),
                clubInfo.getFoundingYear(),
                clubInfo.getAddress(),
                clubInfo.getCity(),
                clubInfo.getState(),
                clubInfo.getCountry(),
                clubInfo.getPostalCode(),
                clubInfo.getEmail(),
                clubInfo.getPhone(),
                clubInfo.getWebsite(),
                clubInfo.getFacebookUrl(),
                clubInfo.getInstagramUrl(),
                clubInfo.getCreatedAt(),
                clubInfo.getUpdatedAt()
        );
    }
}
