package app.villager.dto;

import java.util.UUID;

public record NeighborhoodTreeDto(
    UUID id,
    String name,
    long totalXp,
    double mapX,
    double mapY,
    int residentCount) {}
