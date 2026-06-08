package app.villager.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GroupBuyScheduler {

  private final GroupBuyService groupBuyService;

  public GroupBuyScheduler(GroupBuyService groupBuyService) {
    this.groupBuyService = groupBuyService;
  }

  @Scheduled(fixedDelayString = "${villager.group-buy.scheduler-interval-ms:60000}")
  public void runGroupBuyJobs() {
    groupBuyService.processDeadlines();
  }
}
