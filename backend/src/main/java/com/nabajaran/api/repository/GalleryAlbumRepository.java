package com.nabajaran.api.repository;

import com.nabajaran.api.entity.GalleryAlbum;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryAlbumRepository extends
        JpaRepository<GalleryAlbum, Long>,
        JpaSpecificationExecutor<GalleryAlbum> {

    Optional<GalleryAlbum> findByIdAndDeletedFalse(Long id);

    List<GalleryAlbum> findByPublishedTrueAndDeletedFalseOrderByUpdatedAtDescIdDesc();

    List<GalleryAlbum> findByEvent_IdInAndPublishedTrueAndDeletedFalse(List<Long> eventIds);

    List<GalleryAlbum> findByFestivalEdition_IdInAndDeletedFalse(List<Long> editionIds);

    List<GalleryAlbum> findByFestivalEdition_IdInAndPublishedTrueAndDeletedFalse(List<Long> editionIds);
}
