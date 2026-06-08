package app.villager.dto;

import jakarta.validation.constraints.Min;

public record SimulateGroupBuyRequest(
    @Min(0) int interested,
    @Min(0) int committed) {}
