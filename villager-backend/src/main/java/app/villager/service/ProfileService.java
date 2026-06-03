package app.villager.service;

import app.villager.domain.Profile;
import app.villager.dto.ProfileDto;
import app.villager.repository.ProfileRepository;
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
    return profileRepository.findById(userId)
        .map(p -> firstNonBlank(p.getDisplayName(), p.getNickname(), "이웃"))
        .orElse("이웃");
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
