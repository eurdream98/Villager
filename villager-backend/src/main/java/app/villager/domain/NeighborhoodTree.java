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
@Table(name = "neighborhood_trees")
@Getter
@Setter
public class NeighborhoodTree {

  @Id
  private UUID id;

  @Column(name = "neighborhood_id")
  private UUID neighborhoodId;

  @Column(name = "total_xp")
  private long totalXp;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
