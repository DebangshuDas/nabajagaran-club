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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(
        name = "community_initiatives",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_community_initiatives_slug", columnNames = "slug")
        },
        indexes = {
                @Index(name = "idx_initiatives_club_information_id", columnList = "club_information_id"),
                @Index(name = "idx_initiatives_status", columnList = "status"),
                @Index(name = "idx_initiatives_deleted", columnList = "deleted"),
                @Index(name = "idx_initiatives_published", columnList = "is_published, deleted")
        }
)
public class CommunityInitiative extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_information_id", nullable = false)
    private ClubInformation clubInformation;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 255)
    private String slug;

    @Column(length = 100)
    private String category;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 255)
    private String location;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(nullable = false, length = 20)
    private String status = "PLANNED";

    @Column(name = "is_published", nullable = false)
    private boolean published;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "community_initiative_events",
            joinColumns = @JoinColumn(name = "initiative_id"),
            inverseJoinColumns = @JoinColumn(name = "event_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "pk_community_initiative_events",
                    columnNames = {"initiative_id", "event_id"})
    )
    private Set<Event> relatedEvents = new LinkedHashSet<>();

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

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public Set<Event> getRelatedEvents() {
        return relatedEvents;
    }

    public void setRelatedEvents(Set<Event> relatedEvents) {
        this.relatedEvents = relatedEvents;
    }
}
