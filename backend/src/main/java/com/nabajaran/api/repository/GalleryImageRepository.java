package com.nabajaran.api.repository;

import com.nabajaran.api.entity.GalleryImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryImageRepository extends
        JpaRepository<GalleryImage, Long>,
        JpaSpecificationExecutor<GalleryImage> {

    List<GalleryImage> findAllByIdInAndDeletedFalse(List<Long> ids);
}
