package app.villager.web;

import app.villager.dto.PayoutAccountDto;
import app.villager.dto.PayoutVerificationSendDto;
import app.villager.dto.RegisterPayoutAccountRequest;
import app.villager.dto.VerifyPayoutAccountRequest;
import app.villager.payment.BankCatalog;
import app.villager.security.CurrentUser;
import app.villager.service.PayoutAccountService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profiles/me/payout-account")
public class PayoutAccountController {

  private final PayoutAccountService payoutAccountService;
  private final CurrentUser currentUser;

  public PayoutAccountController(
      PayoutAccountService payoutAccountService, CurrentUser currentUser) {
    this.payoutAccountService = payoutAccountService;
    this.currentUser = currentUser;
  }

  @GetMapping
  PayoutAccountDto get(Authentication auth) {
    return payoutAccountService.getAccount(currentUser.requireUserId(auth));
  }

  @GetMapping("/banks")
  List<Map<String, String>> banks() {
    return BankCatalog.all().entrySet().stream()
        .map(e -> Map.of("code", e.getKey(), "name", e.getValue()))
        .toList();
  }

  @PutMapping
  PayoutAccountDto register(
      Authentication auth, @Valid @RequestBody RegisterPayoutAccountRequest request) {
    return payoutAccountService.register(currentUser.requireUserId(auth), request);
  }

  @PostMapping("/send-verification")
  PayoutVerificationSendDto sendVerification(Authentication auth) {
    return payoutAccountService.sendVerification(currentUser.requireUserId(auth));
  }

  @PostMapping("/verify")
  PayoutAccountDto verify(
      Authentication auth, @Valid @RequestBody VerifyPayoutAccountRequest request) {
    return payoutAccountService.verify(currentUser.requireUserId(auth), request.code());
  }
}
