package app.villager.repository;

import app.villager.domain.TradeConversation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeConversationRepository extends JpaRepository<TradeConversation, UUID> {

  Optional<TradeConversation> findByListingIdAndBuyerId(UUID listingId, UUID buyerId);

  List<TradeConversation> findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(UUID buyerId, UUID sellerId);

  List<TradeConversation> findByListingIdAndBuyerIdOrListingIdAndSellerId(
      UUID listingId, UUID buyerId, UUID listingId2, UUID sellerId);

  List<TradeConversation> findByListingIdOrderByUpdatedAtDesc(UUID listingId);
}
