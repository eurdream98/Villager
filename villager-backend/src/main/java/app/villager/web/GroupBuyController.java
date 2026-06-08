package app.villager.web;

import app.villager.dto.CommitGroupBuyRequest;
import app.villager.dto.CreateGroupBuyRequest;
import app.villager.dto.GroupBuyDto;
import app.villager.dto.SimulateGroupBuyRequest;
import app.villager.security.CurrentUser;
import app.villager.service.GroupBuyService;
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
@RequestMapping("/api/v1/group-buys")
public class GroupBuyController {

  private final GroupBuyService groupBuyService;
  private final CurrentUser currentUser;

  public GroupBuyController(GroupBuyService groupBuyService, CurrentUser currentUser) {
    this.groupBuyService = groupBuyService;
    this.currentUser = currentUser;
  }

  @GetMapping
  List<GroupBuyDto> list(Authentication auth) {
    UUID userId = currentUser.optionalUserId(auth).orElse(null);
    return groupBuyService.listFeed(userId);
  }

  @GetMapping("/{id}")
  GroupBuyDto get(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.optionalUserId(auth).orElse(null);
    return groupBuyService.get(id, userId);
  }

  @PostMapping
  GroupBuyDto create(Authentication auth, @Valid @RequestBody CreateGroupBuyRequest request) {
    UUID userId = currentUser.requireUserId(auth);
    return groupBuyService.create(userId, request);
  }

  @PostMapping("/{id}/interest")
  GroupBuyDto interest(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.requireUserId(auth);
    return groupBuyService.expressInterest(id, userId);
  }

  @PostMapping("/{id}/commit")
  GroupBuyDto commit(
      Authentication auth,
      @PathVariable UUID id,
      @Valid @RequestBody CommitGroupBuyRequest request) {
    UUID userId = currentUser.requireUserId(auth);
    return groupBuyService.commit(id, userId, request);
  }

  @PostMapping("/{id}/cancel")
  GroupBuyDto cancel(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.requireUserId(auth);
    return groupBuyService.cancelParticipation(id, userId);
  }

  @PostMapping("/{id}/pickup")
  GroupBuyDto confirmPickup(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.requireUserId(auth);
    return groupBuyService.confirmPickup(id, userId);
  }

  @PostMapping("/{id}/complete-distribution")
  GroupBuyDto completeDistribution(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.requireUserId(auth);
    return groupBuyService.completeDistribution(id, userId);
  }

  /** 테스트용: 가짜 관심·확정 인원 추가 */
  @PostMapping("/{id}/dev/simulate")
  GroupBuyDto simulate(
      Authentication auth,
      @PathVariable UUID id,
      @Valid @RequestBody SimulateGroupBuyRequest request) {
    UUID userId = currentUser.requireUserId(auth);
    return groupBuyService.simulate(id, userId, request);
  }
}
