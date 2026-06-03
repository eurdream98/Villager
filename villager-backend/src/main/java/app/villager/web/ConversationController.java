package app.villager.web;

import app.villager.dto.ConversationDto;
import app.villager.dto.ConversationSummaryDto;
import app.villager.security.CurrentUser;
import app.villager.service.ConversationService;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ConversationController {

  private final ConversationService conversationService;
  private final CurrentUser currentUser;

  public ConversationController(ConversationService conversationService, CurrentUser currentUser) {
    this.conversationService = conversationService;
    this.currentUser = currentUser;
  }

  @GetMapping("/conversations")
  List<ConversationSummaryDto> list(Authentication auth) {
    return conversationService.listForUser(currentUser.requireUserId(auth));
  }

  @PostMapping("/listings/{listingId}/conversations")
  ConversationDto start(Authentication auth, @PathVariable UUID listingId) {
    return conversationService.getOrCreate(listingId, currentUser.requireUserId(auth));
  }

  @GetMapping("/conversations/{conversationId}")
  ConversationDto get(Authentication auth, @PathVariable UUID conversationId) {
    return conversationService.get(conversationId, currentUser.requireUserId(auth));
  }
}
