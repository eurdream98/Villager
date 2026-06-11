package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CreateListingRequest(
    @NotBlank @Size(max = 80) String title,
    @Size(max = 2000) String description,
    boolean isFree,
    Integer price,
    @NotNull UUID neighborhoodId,
    @Size(max = 100) String neighborhood,
    List<@NotBlank String> imageUrls,
    Double latitude,
    Double longitude,
    @Size(max=200) String address
) {}
