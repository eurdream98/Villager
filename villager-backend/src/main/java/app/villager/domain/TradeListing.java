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
@Table(name = "trade_listings")
@Getter
@Setter
public class TradeListing {

  @Id
  private UUID id;

  @Column(name = "seller_id")
  private UUID sellerId;

  @Column(name = "neighborhood_id")
  private UUID neighborhoodId;

  private String neighborhood;
  private String title;
  private String description;
  private Integer price;

  @Column(name = "is_free")
  private boolean isFree;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", columnDefinition = "listing_status")
  private ListingStatus status;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
