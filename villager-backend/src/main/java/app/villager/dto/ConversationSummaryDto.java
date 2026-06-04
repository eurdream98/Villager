package app.villager.dto;

import java.util.UUID;

public record ConversationSummaryDto(
    UUID id,
    UUID listingId,
    String listingTitle,
    String listingImageUrl,
    int listingPrice,
    boolean listingFree,
    String neighborhood,
    UUID buyerId,
    UUID sellerId,
    String role,
    String peerName,
    UUID peerId,
    String appointmentStatus,
    String lastMessagePreview,
    String updatedAt,
    int unreadCount) {}
