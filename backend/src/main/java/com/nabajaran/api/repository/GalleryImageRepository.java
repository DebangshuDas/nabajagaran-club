package com.nabajaran.api.repository;

import com.nabajaran.api.entity.GalleryImage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryImageRepository extends
        JpaRepository<GalleryImage, Long>,
        JpaSpecificationExecutor<GalleryImage> {

    List<GalleryImage> findAllByIdInAndDeletedFalse(List<Long> ids);

    List<GalleryImage> findByPublicImageTrueAndDeletedFalseAndCategoryIsNotNullOrderByCategoryAscIdAsc();
    Optional<GalleryImage> findByIdAndDeletedFalse(Long id);

    List<GalleryImage> findByAlbum_IdInAndDeletedFalseOrderByAlbum_IdAscDisplayOrderAscIdAsc(List<Long> albumIds);

    List<GalleryImage> findByAlbum_IdInAndPublicImageTrueAndDeletedFalseOrderByAlbum_IdAscDisplayOrderAscIdAsc(
            List<Long> albumIds);

    List<GalleryImage> findByAlbum_IdAndDeletedFalseOrderByDisplayOrderAscIdAsc(Long albumId);

    List<GalleryImage> findByAlbum_IdAndPublicImageTrueAndDeletedFalseOrderByDisplayOrderAscIdAsc(Long albumId);

    boolean existsByAlbum_IdAndIdAndDeletedFalse(Long albumId, Long imageId);

    boolean existsByAlbum_IdAndDeletedFalse(Long albumId);

    long countByAlbum_IdAndDeletedFalse(Long albumId);
}
