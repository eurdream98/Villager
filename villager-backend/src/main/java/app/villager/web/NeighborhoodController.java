package app.villager.web;

import app.villager.dto.RegisterNeighborhoodRequest;
import app.villager.dto.UserNeighborhoodDto;
import app.villager.dto.VerifyNeighborhoodRequest;
import app.villager.security.CurrentUser;
import app.villager.service.NeighborhoodService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/neighborhoods")
public class NeighborhoodController {

  private final NeighborhoodService neighborhoodService;
  private final CurrentUser currentUser;

  public NeighborhoodController(NeighborhoodService neighborhoodService, CurrentUser currentUser) {
    this.neighborhoodService = neighborhoodService;
    this.currentUser = currentUser;
  }

  @GetMapping
  List<UserNeighborhoodDto> list(Authentication auth) {
    return neighborhoodService.listForUser(currentUser.requireUserId(auth));
  }

  @PostMapping
  UserNeighborhoodDto register(Authentication auth, @Valid @RequestBody RegisterNeighborhoodRequest request) {
    return neighborhoodService.register(currentUser.requireUserId(auth), request);
  }

  @PostMapping("/{id}/verify")
  UserNeighborhoodDto verify(
      Authentication auth,
      @PathVariable UUID id,
      @Valid @RequestBody VerifyNeighborhoodRequest request) {
    return neighborhoodService.verify(currentUser.requireUserId(auth), id, request);
  }
}
