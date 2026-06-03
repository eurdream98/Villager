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
@Table(name = "trade_listing_images")
@Getter
@Setter
public class TradeListingImage {

  @Id
  private UUID id;

  @Column(name = "listing_id")
  private UUID listingId;

  @Column(name = "storage_path")
  private String storagePath;

  @Column(name = "public_url")
  private String publicUrl;

  @Column(name = "sort_order")
  private int sortOrder;

  @Column(name = "created_at")
  private Instant createdAt;
}
