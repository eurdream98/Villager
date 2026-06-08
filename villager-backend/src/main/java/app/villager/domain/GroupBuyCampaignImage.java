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
@Table(name = "group_buy_campaign_images")
@Getter
@Setter
public class GroupBuyCampaignImage {

  @Id
  private UUID id;

  @Column(name = "campaign_id")
  private UUID campaignId;

  @Column(name = "public_url")
  private String publicUrl;

  @Column(name = "sort_order")
  private int sortOrder;

  @Column(name = "created_at")
  private Instant createdAt;
}
