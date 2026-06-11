package app.villager.repository;

import app.villager.domain.UserNeighborhood;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNeighborhoodRepository extends JpaRepository<UserNeighborhood, UUID> {

  List<UserNeighborhood> findByUserIdOrderBySlotAsc(UUID userId);

  Optional<UserNeighborhood> findByUserIdAndSlot(UUID userId, short slot);

  Optional<UserNeighborhood> findByUserIdAndNeighborhoodId(UUID userId, UUID neighborhoodId);

  Optional<UserNeighborhood> findByIdAndUserId(UUID id, UUID userId);
}
