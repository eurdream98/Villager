package app.villager.web;

import app.villager.dto.MessageDto;
import app.villager.dto.SendMessageRequest;
import app.villager.security.CurrentUser;
import app.villager.service.MessageService;
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
@RequestMapping("/api/v1/conversations/{conversationId}/messages")
public class MessageController {

  private final MessageService messageService;
  private final CurrentUser currentUser;

  public MessageController(MessageService messageService, CurrentUser currentUser) {
    this.messageService = messageService;
    this.currentUser = currentUser;
  }

  @GetMapping
  List<MessageDto> list(Authentication auth, @PathVariable UUID conversationId) {
    return messageService.list(conversationId, currentUser.requireUserId(auth));
  }

  @PostMapping
  MessageDto send(
      Authentication auth,
      @PathVariable UUID conversationId,
      @Valid @RequestBody SendMessageRequest request) {
    return messageService.send(conversationId, currentUser.requireUserId(auth), request);
  }
}
