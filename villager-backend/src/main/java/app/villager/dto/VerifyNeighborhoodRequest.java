package app.villager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VerifyNeighborhoodRequest(
    @NotNull Double latitude,
    @NotNull Double longitude,
    @Size(max = 100) String detectedNeighborhoodName) {}
