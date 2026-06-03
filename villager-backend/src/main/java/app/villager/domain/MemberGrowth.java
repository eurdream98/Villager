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
@Table(name = "member_growth")
@Getter
@Setter
public class MemberGrowth {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "total_xp")
  private long totalXp;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
