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
@Table(name = "profiles")
@Getter
@Setter
public class Profile {

  @Id
  private UUID id;

  @Column(name = "display_name")
  private String displayName;

  private String nickname;

  @Column(name = "avatar_url")
  private String avatarUrl;

  private String email;
  private String provider;

  @Column(name = "neighborhood_id")
  private UUID neighborhoodId;

  @Column(name = "created_at")
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;
}
