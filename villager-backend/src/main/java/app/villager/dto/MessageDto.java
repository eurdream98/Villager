package app.villager.dto;

import java.util.UUID;

public record MessageDto(
    UUID id,
    UUID conversationId,
    UUID userId,
    String userName,
    String text,
    boolean system,
    String createdAt) {}
