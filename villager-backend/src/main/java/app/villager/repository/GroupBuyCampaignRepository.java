package app.villager.repository;

import app.villager.domain.GroupBuyCampaign;
import app.villager.domain.GroupBuyStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupBuyCampaignRepository extends JpaRepository<GroupBuyCampaign, UUID> {

  List<GroupBuyCampaign> findByStatusInOrderByCreatedAtDesc(List<GroupBuyStatus> statuses);

  List<GroupBuyCampaign> findByStatusAndDeadlineAtBefore(GroupBuyStatus status, Instant deadline);
}
