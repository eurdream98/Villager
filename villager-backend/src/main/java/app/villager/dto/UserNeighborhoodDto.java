package app.villager.dto;

import java.time.Instant;
import java.util.UUID;

public record UserNeighborhoodDto(
    UUID id,
    UUID neighborhoodId,
    String neighborhoodName,
    short slot,
    boolean verified,
    Instant verifiedAt,
    Instant verifiedExpiresAt) {}
