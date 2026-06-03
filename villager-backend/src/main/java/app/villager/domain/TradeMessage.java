package app.villager.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "trade_messages")
@Getter
@Setter
public class TradeMessage {

  @Id
  private UUID id;

  @Column(name = "conversation_id")
  private UUID conversationId;

  @Column(name = "sender_id")
  private UUID senderId;

  private String body;

  @Column(name = "is_system")
  private boolean system;

  @Column(name = "created_at")
  private Instant createdAt;
}
