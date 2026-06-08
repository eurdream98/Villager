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
@Table(name = "group_buy_campaigns")
@Getter
@Setter
public class GroupBuyCampaign {

  @Id
  private UUID id;

  @Column(name = "organizer_id")
  private UUID organizerId;

  private String title;
  private String description;

  @Column(name = "price_per_unit")
  private int pricePerUnit;

  @Column(name = "external_url")
  private String externalUrl;

  @Column(name = "min_committed")
  private int minCommitted;

  @Column(name = "max_committed")
  private Integer maxCommitted;

  @Column(name = "deadline_at")
  private Instant deadlineAt;

  @Column(name = "pickup_location")
  private String pickupLocation;

  @Column(name = "pickup_start_at")
  private Instant pickupStartAt;

  @Column(name = "pickup_end_at")
  private Instant pickupEndAt;

  @Column(name = "pickup_notes")
  private String pickupNotes;

  private String neighborhood;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", columnDefinition = "group_buy_status")
  private GroupBuyStatus status;

  @Column(name = "dev_simulated_interested")
  private int devSimulatedInterested;

  @Column(name = "dev_simulated_committed")
  private int devSimulatedCommitted;

  @Column(name = "succeeded_at")
  private Instant succeededAt;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
