package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveNeighborhoodRequest(
    @NotBlank @Size(max=100) String name,
    Double latitude,
    Double longitude
){}
