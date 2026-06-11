package app.villager.dto;

import java.util.UUID;

public record NeighborhoodDto(
    UUID id,
    String name,
    String slug,
    Double centerLat,
    Double centerLng,
    Integer verifyRadiusM) {}
