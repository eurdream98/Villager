package app.villager.repository;

import app.villager.domain.ListingStatus;
import app.villager.domain.TradeListing;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeListingRepository extends JpaRepository<TradeListing, UUID> {

  List<TradeListing> findByStatusOrderByCreatedAtDesc(ListingStatus status);

  List<TradeListing> findByStatusAndNeighborhoodIdInOrderByCreatedAtDesc(
      ListingStatus status, List<UUID> neighborhoodIds);

  Optional<TradeListing> findByIdAndStatus(UUID id, ListingStatus status);
}
