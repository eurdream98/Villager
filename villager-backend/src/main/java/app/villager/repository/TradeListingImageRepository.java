package app.villager.repository;

import app.villager.domain.TradeListingImage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeListingImageRepository extends JpaRepository<TradeListingImage, UUID> {

  List<TradeListingImage> findByListingIdOrderBySortOrderAsc(UUID listingId);

  List<TradeListingImage> findByListingIdInOrderBySortOrderAsc(List<UUID> listingIds);
}
