package app.villager.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "neighborhoods")
@Getter
@Setter
public class Neighborhood {

  @Id
  private UUID id;

  private String name;
  private String slug;

  @Column(name = "map_x")
  private BigDecimal mapX;

  @Column(name = "map_y")
  private BigDecimal mapY;

  @Column(name = "center_lat")
  private Double centerLat;

  @Column(name = "center_lng")
  private Double centerLng;

  @Column(name = "verify_radius_m")
  private Integer verifyRadiusM;

  @Column(name = "created_at")
  private Instant createdAt;
}
