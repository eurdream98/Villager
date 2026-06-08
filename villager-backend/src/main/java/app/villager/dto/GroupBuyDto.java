package app.villager.dto;

import java.util.List;
import java.util.UUID;

public record GroupBuyDto(
    UUID id,
    String title,
    String description,
    int pricePerUnit,
    String externalUrl,
    int minCommitted,
    Integer maxCommitted,
    String deadlineAt,
    String pickupLocation,
    String pickupStartAt,
    String pickupEndAt,
    String pickupNotes,
    String neighborhood,
    String status,
    int interestedCount,
    int committedCount,
    int committedQuantity,
    int pickedUpCount,
    boolean devSimulated,
    UUID organizerId,
    String organizerName,
    List<String> imageUrls,
    String myTier,
    Integer myQuantity,
    boolean myPickedUp,
    String createdAt,
    String succeededAt) {}
