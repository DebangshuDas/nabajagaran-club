package com.nabajaran.api.repository;

import com.nabajaran.api.entity.HomepageConfiguration;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HomepageConfigurationRepository extends JpaRepository<HomepageConfiguration, Long> {

    @EntityGraph(attributePaths = "sections")
    Optional<HomepageConfiguration> findWithSectionsById(Long id);
}
