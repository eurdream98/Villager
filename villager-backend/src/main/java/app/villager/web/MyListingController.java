package app.villager.web;

import app.villager.dto.ListingTradeStatusDto;
import app.villager.security.CurrentUser;
import app.villager.service.ConversationService;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/listings")
public class MyListingController {

  private final ConversationService conversationService;
  private final CurrentUser currentUser;

  public MyListingController(ConversationService conversationService, CurrentUser currentUser) {
    this.conversationService = conversationService;
    this.currentUser = currentUser;
  }

  @GetMapping("/{listingId}/trade-status")
  ListingTradeStatusDto tradeStatus(Authentication auth, @PathVariable UUID listingId) {
    return conversationService.listingTradeStatus(listingId, currentUser.requireUserId(auth));
  }
}
