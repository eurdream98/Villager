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
    String neighborhood,
    UUID sellerId,
    String sellerName,
    String createdAt,
    String myAppointmentStatus) {}
