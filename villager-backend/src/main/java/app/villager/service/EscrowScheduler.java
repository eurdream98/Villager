package app.villager.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EscrowScheduler {

  private final EscrowService escrowService;

  public EscrowScheduler(EscrowService escrowService) {
    this.escrowService = escrowService;
  }

  /** 결제 기한·자동 정산 처리 (1분마다) */
  @Scheduled(fixedDelayString = "${villager.escrow.scheduler-interval-ms:60000}")
  public void runEscrowJobs() {
    escrowService.processExpiredPaymentDeadlines();
    escrowService.processAutoReceiptConfirm();
    escrowService.processAutoConfirmDeadlines();
  }
}
