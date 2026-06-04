package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProposeSettlementRequest(
    @NotBlank @Size(max = 30) String type,
    Integer refundAmount,
    @Size(max = 300) String notes) {}
