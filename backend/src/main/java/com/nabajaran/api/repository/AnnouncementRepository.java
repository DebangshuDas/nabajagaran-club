package com.nabajaran.api.repository;

import com.nabajaran.api.entity.Announcement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByPublishedTrueAndDeletedFalseOrderByPublishedAtDesc();
}
