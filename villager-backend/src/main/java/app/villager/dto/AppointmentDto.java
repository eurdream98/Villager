package app.villager.dto;

import java.util.UUID;

public record AppointmentDto(
    UUID id,
    UUID conversationId,
    String tradeMethod,
    String scheduledAt,
    String location,
    String status,
    UUID proposedBy,
    String proposedByName,
    UUID confirmedBy,
    String confirmedAt) {}
