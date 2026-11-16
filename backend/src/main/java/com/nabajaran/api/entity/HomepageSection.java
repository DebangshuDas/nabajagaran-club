package com.nabajaran.api.entity;

import com.nabajaran.api.enums.HomepageSectionType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "homepage_sections")
public class HomepageSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "homepage_configuration_id", nullable = false)
    private HomepageConfiguration configuration;

    @Enumerated(EnumType.STRING)
    @Column(name = "section_type", nullable = false, length = 30)
    private HomepageSectionType type;

    @Column(name = "is_visible", nullable = false)
    private boolean visible;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HomepageSectionItem> items = new ArrayList<>();

    public Long getId() { return id; }
    public HomepageConfiguration getConfiguration() { return configuration; }
    public void setConfiguration(HomepageConfiguration configuration) { this.configuration = configuration; }
    public HomepageSectionType getType() { return type; }
    public void setType(HomepageSectionType type) { this.type = type; }
    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public List<HomepageSectionItem> getItems() { return items; }
    public void setItems(List<HomepageSectionItem> items) { this.items = items; }
}
