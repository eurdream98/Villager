package app.villager.repository;

import app.villager.domain.TradeMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeMessageRepository extends JpaRepository<TradeMessage, UUID> {

  List<TradeMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

  java.util.Optional<TradeMessage> findFirstByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}
