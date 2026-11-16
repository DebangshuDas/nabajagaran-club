package com.nabajaran.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "homepage_section_items")
public class HomepageSectionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "homepage_section_id", nullable = false)
    private HomepageSection section;

    @Column(name = "content_key", nullable = false, length = 255)
    private String contentKey;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    public Long getId() { return id; }
    public HomepageSection getSection() { return section; }
    public void setSection(HomepageSection section) { this.section = section; }
    public String getContentKey() { return contentKey; }
    public void setContentKey(String contentKey) { this.contentKey = contentKey; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
