package app.villager.dto;

import java.util.List;
import java.util.UUID;

public record ListingDto(
    UUID id,
    String title,
    String description,
    int price,
    boolean isFree,
    List<String> imageUrls,
    UUID neighborhoodId,
    String neighborhood,
    Double latitude,
    Double longitude,
    String address,
    UUID sellerId,
    String sellerName,
    String createdAt,
    String myAppointmentStatus) {}
