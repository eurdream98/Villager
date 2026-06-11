package app.villager.repository;

import app.villager.domain.Neighborhood;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NeighborhoodRepository extends JpaRepository<Neighborhood, UUID> {

  java.util.Optional<Neighborhood> findByName(String name);

  boolean existsBySlug(String slug);
}
