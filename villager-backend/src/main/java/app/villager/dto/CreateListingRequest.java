package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateListingRequest(
    @NotBlank @Size(max = 80) String title,
    @Size(max = 2000) String description,
    boolean isFree,
    Integer price,
    @Size(max = 100) String neighborhood,
    List<@NotBlank String> imageUrls,
    Double latitude,
    Double longitude,
    @Size(max=200) String address
) {}
