package com.nabajaran.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(
        name = "festival_editions",
        indexes = {
                @Index(name = "idx_festival_editions_festival", columnList = "festival_id, deleted"),
                @Index(name = "idx_festival_editions_published", columnList = "is_published, deleted")
        }
)
public class FestivalEdition extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "festival_id", nullable = false)
    private Festival festival;

    @Column(name = "festival_year", nullable = false)
    private Integer year;

    @Column(name = "active_year")
    private Integer activeYear;

    @Column(length = 200)
    private String theme;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "featured_highlights", columnDefinition = "TEXT")
    private String featuredHighlights;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 255)
    private String venue;

    @Column(length = 255)
    private String address;

    @Column(name = "is_published", nullable = false)
    private boolean published;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "festival_edition_events",
            joinColumns = @JoinColumn(name = "festival_edition_id"),
            inverseJoinColumns = @JoinColumn(name = "event_id")
    )
    private Set<Event> scheduledEvents = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "festival_edition_gallery_images",
            joinColumns = @JoinColumn(name = "festival_edition_id"),
            inverseJoinColumns = @JoinColumn(name = "gallery_image_id")
    )
    private Set<GalleryImage> galleryImages = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "festival_edition_sponsors",
            joinColumns = @JoinColumn(name = "festival_edition_id"),
            inverseJoinColumns = @JoinColumn(name = "sponsor_id")
    )
    private Set<Sponsor> sponsors = new LinkedHashSet<>();

    @PrePersist
    @PreUpdate
    private void updateActiveYear() {
        activeYear = isDeleted() ? null : year;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Festival getFestival() {
        return festival;
    }

    public void setFestival(Festival festival) {
        this.festival = festival;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getActiveYear() {
        return activeYear;
    }

    public void setActiveYear(Integer activeYear) {
        this.activeYear = activeYear;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFeaturedHighlights() {
        return featuredHighlights;
    }

    public void setFeaturedHighlights(String featuredHighlights) {
        this.featuredHighlights = featuredHighlights;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public Set<Event> getScheduledEvents() {
        return scheduledEvents;
    }

    public void setScheduledEvents(Set<Event> scheduledEvents) {
        this.scheduledEvents = scheduledEvents;
    }

    public Set<GalleryImage> getGalleryImages() {
        return galleryImages;
    }

    public void setGalleryImages(Set<GalleryImage> galleryImages) {
        this.galleryImages = galleryImages;
    }

    public Set<Sponsor> getSponsors() {
        return sponsors;
    }

    public void setSponsors(Set<Sponsor> sponsors) {
        this.sponsors = sponsors;
    }
}
