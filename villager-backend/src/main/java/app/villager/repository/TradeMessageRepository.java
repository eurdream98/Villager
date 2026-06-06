package app.villager.repository;

import app.villager.domain.TradeMessage;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TradeMessageRepository extends JpaRepository<TradeMessage, UUID> {

  List<TradeMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

  java.util.Optional<TradeMessage> findFirstByConversationIdOrderByCreatedAtDesc(UUID conversationId);

  boolean existsByConversationId(UUID conversationId);

  @Query("SELECT DISTINCT m.conversationId FROM TradeMessage m WHERE m.conversationId IN :ids")
  List<UUID> findDistinctConversationIds(@Param("ids") Collection<UUID> ids);

  @Query("""
      SELECT m FROM TradeMessage m
      WHERE m.conversationId IN :ids
      AND NOT EXISTS (
        SELECT 1 FROM TradeMessage m2
        WHERE m2.conversationId = m.conversationId
        AND m2.createdAt > m.createdAt
      )
      """)
  List<TradeMessage> findLatestByConversationIdIn(@Param("ids") Collection<UUID> ids);

  long countByConversationIdAndSenderIdNotAndSystemFalseAndCreatedAtAfter(
      UUID conversationId, UUID senderId, Instant createdAt);
}
