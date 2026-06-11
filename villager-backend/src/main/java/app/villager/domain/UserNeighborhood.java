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
@Table(name = "user_neighborhoods")
@Getter
@Setter
public class UserNeighborhood {

  @Id
  private UUID id;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "neighborhood_id")
  private UUID neighborhoodId;

  private Short slot;

  private Boolean verified;

  @Column(name = "verified_at")
  private Instant verifiedAt;

  @Column(name = "verified_expires_at")
  private Instant verifiedExpiresAt;

  @Column(name = "verified_lat")
  private Double verifiedLat;

  @Column(name = "verified_lng")
  private Double verifiedLng;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
