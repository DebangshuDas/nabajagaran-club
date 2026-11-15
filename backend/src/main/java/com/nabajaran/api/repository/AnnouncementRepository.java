package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Announcement;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long>,
        JpaSpecificationExecutor<Announcement> {

    List<Announcement> findByPublishedTrueAndDeletedFalseOrderByPublishedAtDesc();

    Optional<Announcement> findByIdAndDeletedFalse(Long id);
}
