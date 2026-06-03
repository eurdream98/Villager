package app.villager.web;

import app.villager.dto.MemberGrowthDto;
import app.villager.dto.NeighborhoodTreeDto;
import app.villager.security.CurrentUser;
import app.villager.service.GrowthService;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class GrowthController {

  private final GrowthService growthService;
  private final CurrentUser currentUser;

  public GrowthController(GrowthService growthService, CurrentUser currentUser) {
    this.growthService = growthService;
    this.currentUser = currentUser;
  }

  @GetMapping("/growth/me")
  MemberGrowthDto myGrowth(Authentication auth) {
    return growthService.getMemberGrowth(currentUser.requireUserId(auth));
  }

  @GetMapping("/neighborhoods/trees")
  List<NeighborhoodTreeDto> neighborhoodTrees() {
    return growthService.getNeighborhoodTrees();
  }
}
