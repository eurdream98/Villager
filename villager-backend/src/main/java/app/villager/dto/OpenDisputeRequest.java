package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OpenDisputeRequest(
    @NotBlank @Size(max = 50) String reason,
    @Size(max = 500) String detail) {}
