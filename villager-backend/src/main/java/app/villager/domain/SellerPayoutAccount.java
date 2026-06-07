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
@Table(name = "seller_payout_accounts")
@Getter
@Setter
public class SellerPayoutAccount {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "bank_code")
  private String bankCode;

  @Column(name = "bank_name")
  private String bankName;

  @Column(name = "account_number")
  private String accountNumber;

  @Column(name = "account_holder")
  private String accountHolder;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", columnDefinition = "payout_account_status")
  private PayoutAccountStatus status;

  @Column(name = "verification_code")
  private String verificationCode;

  @Column(name = "verification_sent_at")
  private Instant verificationSentAt;

  @Column(name = "verified_at")
  private Instant verifiedAt;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
