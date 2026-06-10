package app.villager.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "trade_appointments")
@Getter
@Setter
public class TradeAppointment {

  @Id
  private UUID id;

  @Column(name = "conversation_id")
  private UUID conversationId;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "trade_method", columnDefinition = "trade_method")
  private TradeMethod tradeMethod;

  @Column(name = "scheduled_at")
  private Instant scheduledAt;

  private String location;
  private Double latitude;
  private Double longitude;
  private String address;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", columnDefinition = "appointment_status")
  private AppointmentStatus status;

  @Column(name = "proposed_by")
  private UUID proposedBy;

  @Column(name = "confirmed_by")
  private UUID confirmedBy;

  @Column(name = "confirmed_at")
  private Instant confirmedAt;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
