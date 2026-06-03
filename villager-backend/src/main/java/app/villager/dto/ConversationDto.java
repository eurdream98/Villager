package app.villager.dto;

import java.util.UUID;

public record ConversationDto(
    UUID id,
    UUID listingId,
    String listingTitle,
    UUID buyerId,
    UUID sellerId,
    String peerName,
    UUID peerId) {}
