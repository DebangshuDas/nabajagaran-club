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
        name = "gallery_albums",
        indexes = {
                @Index(name = "idx_gallery_albums_public", columnList = "is_published, deleted, updated_at"),
                @Index(name = "idx_gallery_albums_event", columnList = "event_id, is_published, deleted"),
                @Index(name = "idx_gallery_albums_initiative", columnList = "initiative_id, is_published, deleted"),
                @Index(name = "idx_gallery_albums_festival_edition",
                        columnList = "festival_edition_id, is_published, deleted")
        }
)
public class GalleryAlbum extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_information_id", nullable = false)
    private ClubInformation clubInformation;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String category;

    @Column(name = "cover_image_id")
    private Long coverImageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiative_id")
    private CommunityInitiative initiative;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "festival_edition_id")
    private FestivalEdition festivalEdition;

    @Column(name = "is_published", nullable = false)
    private boolean published;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Long getCoverImageId() {
        return coverImageId;
    }

    public void setCoverImageId(Long coverImageId) {
        this.coverImageId = coverImageId;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public CommunityInitiative getInitiative() {
        return initiative;
    }

    public void setInitiative(CommunityInitiative initiative) {
        this.initiative = initiative;
    }

    public FestivalEdition getFestivalEdition() {
        return festivalEdition;
    }

    public void setFestivalEdition(FestivalEdition festivalEdition) {
        this.festivalEdition = festivalEdition;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }
}
