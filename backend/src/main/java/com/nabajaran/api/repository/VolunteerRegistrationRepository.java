package com.nabajaran.api.repository;

import com.nabajaran.api.entity.VolunteerRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VolunteerRegistrationRepository extends JpaRepository<VolunteerRegistration, Long> {
}
