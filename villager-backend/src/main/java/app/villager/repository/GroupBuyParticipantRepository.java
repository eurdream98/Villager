package app.villager.repository;

import app.villager.domain.GroupBuyParticipant;
import app.villager.domain.GroupBuyParticipantTier;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupBuyParticipantRepository extends JpaRepository<GroupBuyParticipant, UUID> {

  Optional<GroupBuyParticipant> findByCampaignIdAndUserId(UUID campaignId, UUID userId);

  List<GroupBuyParticipant> findByCampaignIdOrderByCreatedAtAsc(UUID campaignId);

  long countByCampaignIdAndTier(UUID campaignId, GroupBuyParticipantTier tier);

  @Query(
      "select coalesce(sum(p.quantity), 0) from GroupBuyParticipant p "
          + "where p.campaignId = :campaignId and p.tier = :tier")
  long sumQuantityByCampaignIdAndTier(
      @Param("campaignId") UUID campaignId, @Param("tier") GroupBuyParticipantTier tier);

  long countByCampaignIdAndTierAndPickedUpAtIsNotNull(
      UUID campaignId, GroupBuyParticipantTier tier);

  List<GroupBuyParticipant> findByCampaignIdInAndUserId(
      List<UUID> campaignIds, UUID userId);
}
