package com.nabajaran.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "gallery_images",
        indexes = {
                @Index(name = "idx_gallery_images_club_information_id", columnList = "club_information_id"),
                @Index(name = "idx_gallery_images_public", columnList = "is_public, deleted")
        }
)
public class GalleryImage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_information_id", nullable = false)
    private ClubInformation clubInformation;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(length = 50)
    private String category;

    @Column(name = "is_public", nullable = false)
    private boolean publicImage = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ClubInformation getClubInformation() {
        return clubInformation;
    }

    public void setClubInformation(ClubInformation clubInformation) {
        this.clubInformation = clubInformation;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getAltText() {
        return altText;
    }

    public void setAltText(String altText) {
        this.altText = altText;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isPublicImage() {
        return publicImage;
    }

    public void setPublicImage(boolean publicImage) {
        this.publicImage = publicImage;
    }
}
