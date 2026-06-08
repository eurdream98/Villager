package app.villager.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "group_buy_participants")
@Getter
@Setter
public class GroupBuyParticipant {

  @Id
  private UUID id;

  @Column(name = "campaign_id")
  private UUID campaignId;

  @Column(name = "user_id")
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "tier", columnDefinition = "group_buy_participant_tier")
  private GroupBuyParticipantTier tier;

  private int quantity;

  @Column(name = "payment_ref")
  private String paymentRef;

  @Column(name = "picked_up_at")
  private Instant pickedUpAt;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
