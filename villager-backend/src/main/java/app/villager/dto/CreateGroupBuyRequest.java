package app.villager.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateGroupBuyRequest(
    @NotBlank String title,
    String description,
    @Min(1) int pricePerUnit,
    String externalUrl,
    @Min(2) int minCommitted,
    Integer maxCommitted,
    @NotBlank String deadlineAt,
    @NotBlank String pickupLocation,
    @NotBlank String pickupStartAt,
    @NotBlank String pickupEndAt,
    String pickupNotes,
    String neighborhood,
    @NotEmpty List<String> imageUrls) {}
