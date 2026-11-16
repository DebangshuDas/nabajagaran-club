package com.nabajaran.api.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "homepage_configurations")
public class HomepageConfiguration {

    @Id
    private Long id = 1L;

    @Column(name = "hero_title", nullable = false, length = 200)
    private String heroTitle;

    @Column(name = "hero_subtitle", length = 500)
    private String heroSubtitle;

    @Column(name = "hero_image_url", length = 255)
    private String heroImageUrl;

    @Column(name = "cta_text", length = 100)
    private String ctaText;

    @Column(name = "cta_url", length = 255)
    private String ctaUrl;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "configuration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HomepageSection> sections = new ArrayList<>();

    @PrePersist
    @PreUpdate
    private void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getHeroTitle() { return heroTitle; }
    public void setHeroTitle(String heroTitle) { this.heroTitle = heroTitle; }
    public String getHeroSubtitle() { return heroSubtitle; }
    public void setHeroSubtitle(String heroSubtitle) { this.heroSubtitle = heroSubtitle; }
    public String getHeroImageUrl() { return heroImageUrl; }
    public void setHeroImageUrl(String heroImageUrl) { this.heroImageUrl = heroImageUrl; }
    public String getCtaText() { return ctaText; }
    public void setCtaText(String ctaText) { this.ctaText = ctaText; }
    public String getCtaUrl() { return ctaUrl; }
    public void setCtaUrl(String ctaUrl) { this.ctaUrl = ctaUrl; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<HomepageSection> getSections() { return sections; }
    public void setSections(List<HomepageSection> sections) { this.sections = sections; }
}
