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
                @Index(name = "idx_gallery_images_public", columnList = "is_public, deleted"),
                @Index(name = "idx_gallery_images_album_order", columnList = "album_id, display_order, deleted"),
                @Index(name = "idx_gallery_images_storage_key", columnList = "storage_key")
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "album_id", nullable = false)
    private GalleryAlbum album;

    @Column(name = "image_url", nullable = false, length = 2048)
    private String imageUrl;

    @Column(name = "storage_key", length = 512)
    private String storageKey;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(length = 50)
    private String category;

    @Column(name = "is_public", nullable = false)
    private boolean publicImage;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

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

    public GalleryAlbum getAlbum() {
        return album;
    }

    public void setAlbum(GalleryAlbum album) {
        this.album = album;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
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

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }
}
