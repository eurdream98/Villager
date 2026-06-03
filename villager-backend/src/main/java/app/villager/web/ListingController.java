package app.villager.web;

import app.villager.dto.CreateListingRequest;
import app.villager.dto.ListingDto;
import app.villager.security.CurrentUser;
import app.villager.service.ListingService;
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
@RequestMapping("/api/v1/listings")
public class ListingController {

  private final ListingService listingService;
  private final CurrentUser currentUser;

  public ListingController(ListingService listingService, CurrentUser currentUser) {
    this.listingService = listingService;
    this.currentUser = currentUser;
  }

  @GetMapping
  List<ListingDto> list(Authentication auth) {
    UUID userId = currentUser.optionalUserId(auth).orElse(null);
    return listingService.listActive(userId);
  }

  @GetMapping("/{id}")
  ListingDto get(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.optionalUserId(auth).orElse(null);
    return listingService.getActive(id, userId);
  }

  @PostMapping
  ListingDto create(Authentication auth, @Valid @RequestBody CreateListingRequest request) {
    UUID userId = currentUser.requireUserId(auth);
    return listingService.create(userId, request);
  }
}
