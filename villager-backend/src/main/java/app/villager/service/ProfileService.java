package app.villager.service;

import app.villager.domain.Profile;
import app.villager.dto.ProfileDto;
import app.villager.repository.ProfileRepository;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProfileService {

  private final ProfileRepository profileRepository;

  public ProfileService(ProfileRepository profileRepository) {
    this.profileRepository = profileRepository;
  }

  public ProfileDto getProfile(UUID userId) {
    Profile profile = profileRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없습니다."));
    return toDto(profile);
  }

  public String displayName(UUID userId) {
    return displayNames(java.util.List.of(userId)).getOrDefault(userId, "이웃");
  }

  public Map<UUID, String> displayNames(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty()) {
      return Map.of();
    }
    Map<UUID, String> result = new HashMap<>();
    profileRepository.findAllById(userIds).forEach(profile -> result.put(
        profile.getId(),
        firstNonBlank(profile.getDisplayName(), profile.getNickname(), "이웃")));
    return result;
  }

  public static ProfileDto toDto(Profile profile) {
    return new ProfileDto(
        profile.getId(),
        profile.getDisplayName(),
        profile.getNickname(),
        profile.getAvatarUrl(),
        profile.getEmail(),
        profile.getProvider());
  }

  private static String firstNonBlank(String... values) {
    for (String v : values) {
      if (v != null && !v.isBlank()) {
        return v;
      }
    }
    return "이웃";
  }
}
