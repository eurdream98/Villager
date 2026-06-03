package app.villager.web;

import app.villager.dto.ProfileDto;
import app.villager.security.CurrentUser;
import app.villager.service.ProfileService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {

  private final ProfileService profileService;
  private final CurrentUser currentUser;

  public ProfileController(ProfileService profileService, CurrentUser currentUser) {
    this.profileService = profileService;
    this.currentUser = currentUser;
  }

  @GetMapping("/me")
  ProfileDto me(Authentication auth) {
    return profileService.getProfile(currentUser.requireUserId(auth));
  }
}
