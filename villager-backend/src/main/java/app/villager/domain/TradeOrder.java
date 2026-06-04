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
@Table(name = "trade_orders")
@Getter
@Setter
public class TradeOrder {

  @Id
  private UUID id;

  @Column(name = "conversation_id")
  private UUID conversationId;

  @Column(name = "listing_id")
  private UUID listingId;

  @Column(name = "buyer_id")
  private UUID buyerId;

  @Column(name = "seller_id")
  private UUID sellerId;

  @Column(name = "appointment_id")
  private UUID appointmentId;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "trade_method", columnDefinition = "trade_method")
  private TradeMethod tradeMethod;

  private Integer amount;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "escrow_status", columnDefinition = "escrow_status")
  private EscrowStatus escrowStatus;

  @Column(name = "paid_at")
  private Instant paidAt;

  @Column(name = "fulfilled_at")
  private Instant fulfilledAt;

  @Column(name = "confirmed_at")
  private Instant confirmedAt;

  @Column(name = "released_at")
  private Instant releasedAt;

  @Column(name = "refunded_at")
  private Instant refundedAt;

  @Column(name = "payment_deadline_at")
  private Instant paymentDeadlineAt;

  @Column(name = "inspection_deadline_at")
  private Instant inspectionDeadlineAt;

  @Column(name = "receipt_confirm_deadline_at")
  private Instant receiptConfirmDeadlineAt;

  @Column(name = "disputed_at")
  private Instant disputedAt;

  @Column(name = "dispute_reason")
  private String disputeReason;

  @Column(name = "dispute_detail")
  private String disputeDetail;

  @Column(name = "settlement_amount")
  private Integer settlementAmount;

  @Column(name = "pending_settlement_type")
  private String pendingSettlementType;

  @Column(name = "pending_settlement_amount")
  private Integer pendingSettlementAmount;

  @Column(name = "pending_settlement_by")
  private UUID pendingSettlementBy;

  @Column(name = "pending_settlement_at")
  private Instant pendingSettlementAt;

  @Column(name = "payment_ref")
  private String paymentRef;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
