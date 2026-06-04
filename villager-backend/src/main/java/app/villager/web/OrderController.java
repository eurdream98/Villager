package app.villager.web;

import app.villager.dto.OpenDisputeRequest;
import app.villager.dto.ProposeSettlementRequest;
import app.villager.dto.TradeOrderDto;
import app.villager.security.CurrentUser;
import app.villager.service.EscrowService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations/{conversationId}/order")
public class OrderController {

  private final EscrowService escrowService;
  private final CurrentUser currentUser;

  public OrderController(EscrowService escrowService, CurrentUser currentUser) {
    this.escrowService = escrowService;
    this.currentUser = currentUser;
  }

  @GetMapping
  TradeOrderDto get(Authentication auth, @PathVariable UUID conversationId) {
    return escrowService.getOrder(conversationId, currentUser.requireUserId(auth));
  }

  @PostMapping("/pay")
  TradeOrderDto pay(Authentication auth, @PathVariable UUID conversationId) {
    return escrowService.pay(conversationId, currentUser.requireUserId(auth));
  }

  @PostMapping("/fulfill")
  TradeOrderDto fulfill(Authentication auth, @PathVariable UUID conversationId) {
    return escrowService.fulfill(conversationId, currentUser.requireUserId(auth));
  }

  @PostMapping("/confirm-receipt")
  TradeOrderDto confirmReceipt(Authentication auth, @PathVariable UUID conversationId) {
    return escrowService.confirmReceipt(conversationId, currentUser.requireUserId(auth));
  }

  @PostMapping("/complete")
  TradeOrderDto complete(Authentication auth, @PathVariable UUID conversationId) {
    return escrowService.complete(conversationId, currentUser.requireUserId(auth));
  }

  @PostMapping("/dispute")
  TradeOrderDto dispute(
      Authentication auth,
      @PathVariable UUID conversationId,
      @Valid @RequestBody OpenDisputeRequest request) {
    return escrowService.openDispute(
        conversationId, currentUser.requireUserId(auth), request.reason(), request.detail());
  }

  @PostMapping("/propose-settlement")
  TradeOrderDto proposeSettlement(
      Authentication auth,
      @PathVariable UUID conversationId,
      @Valid @RequestBody ProposeSettlementRequest request) {
    return escrowService.proposeSettlement(
        conversationId, currentUser.requireUserId(auth), request);
  }

  @PostMapping("/accept-settlement")
  TradeOrderDto acceptSettlement(Authentication auth, @PathVariable UUID conversationId) {
    return escrowService.acceptSettlement(conversationId, currentUser.requireUserId(auth));
  }
}
