package app.villager.repository;

import app.villager.domain.EscrowStatus;
import app.villager.domain.TradeOrder;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeOrderRepository extends JpaRepository<TradeOrder, UUID> {

  Optional<TradeOrder> findByConversationId(UUID conversationId);

  List<TradeOrder> findByEscrowStatusAndPaymentDeadlineAtBefore(
      EscrowStatus escrowStatus, Instant deadline);

  List<TradeOrder> findByEscrowStatusAndInspectionDeadlineAtBefore(
      EscrowStatus escrowStatus, Instant deadline);

  List<TradeOrder> findByEscrowStatusAndReceiptConfirmDeadlineAtBefore(
      EscrowStatus escrowStatus, Instant deadline);
}
