package app.villager.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterNeighborhoodRequest(
    @Min(1) @Max(2) short slot,
    @NotBlank @Size(max = 100) String name,
    Double latitude,
    Double longitude) {}
