package app.villager.security;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

  public UUID requireUserId(Authentication authentication) {
    return optionalUserId(authentication)
        .orElseThrow(() -> new IllegalStateException("인증이 필요합니다."));
  }

  public Optional<UUID> optionalUserId(Authentication authentication) {
    if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
      return Optional.empty();
    }
    return Optional.of(UUID.fromString(jwt.getSubject()));
  }
}
