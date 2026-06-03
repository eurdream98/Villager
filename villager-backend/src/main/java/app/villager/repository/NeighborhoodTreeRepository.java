package app.villager.repository;

import app.villager.domain.NeighborhoodTree;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NeighborhoodTreeRepository extends JpaRepository<NeighborhoodTree, UUID> {

  List<NeighborhoodTree> findAllByOrderByTotalXpDesc();
}
