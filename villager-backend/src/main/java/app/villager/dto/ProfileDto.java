package app.villager.dto;

import java.util.UUID;

public record ProfileDto(
    UUID id,
    String displayName,
    String nickname,
    String avatarUrl,
    String email,
    String provider) {}
