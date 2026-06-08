package app.villager.dto;

import jakarta.validation.constraints.Min;

public record CommitGroupBuyRequest(@Min(1) int quantity) {}
