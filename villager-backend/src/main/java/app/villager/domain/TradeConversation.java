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
@Table(name = "trade_conversations")
@Getter
@Setter
public class TradeConversation {

  @Id
  private UUID id;

  @Column(name = "listing_id")
  private UUID listingId;

  @Column(name = "buyer_id")
  private UUID buyerId;

  @Column(name = "seller_id")
  private UUID sellerId;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  @Column(name = "buyer_last_read_at")
  private Instant buyerLastReadAt;

  @Column(name = "seller_last_read_at")
  private Instant sellerLastReadAt;
}
