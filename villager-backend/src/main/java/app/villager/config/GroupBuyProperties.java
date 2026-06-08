package app.villager.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "villager.group-buy")
public class GroupBuyProperties {

  /** true: 확정 참여 시 mock 결제 (에스크로 보류 시뮬레이션) */
  private boolean mockPaymentEnabled = true;

  /** true: 테스트용 가짜 관심·확정 인원 추가 API 허용 */
  private boolean devSimulateEnabled = true;

  private long schedulerIntervalMs = 60000;
}
