package app.villager.repository;

import app.villager.domain.GroupBuyCampaignImage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupBuyCampaignImageRepository extends JpaRepository<GroupBuyCampaignImage, UUID> {

  List<GroupBuyCampaignImage> findByCampaignIdOrderBySortOrderAsc(UUID campaignId);
}
