package app.villager.dto;

import java.util.UUID;

public record ListingTradeStatusDto(
    boolean hasConfirmedAppointment,
    String appointmentStatus,
    UUID conversationId) {}
