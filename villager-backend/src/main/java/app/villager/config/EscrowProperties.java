package app.villager.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "villager.escrow")
public class EscrowProperties {

  /** 약속 확정 후 구매자 결제 기한 (시간) */
  private int paymentDeadlineHours = 24;

  /** 택배 수령 확인 후 자동 정산까지 (시간) — 기본 7일 */
  private int inspectionDeadlineHoursShipping = 168;

  /** 문고리 수령 확인 후 자동 정산까지 (시간) — 기본 48시간 */
  private int inspectionDeadlineHoursDoor = 48;

  /** 판매자 이행 후 구매자 수령 확인 없을 때 자동 수령 확정까지 (시간) — 기본 7일 */
  private int autoReceiptConfirmHours = 168;

  /** true: PG 없이 mock 결제 허용 (POST .../order/pay 개발용) */
  private boolean mockPaymentEnabled = true;

  /** true: 1원 인증 시뮬레이션 (입금자명·인증번호 노출) */
  private boolean mockPayoutVerificationEnabled = true;

  /** true: 택배·문고리 에스크로 전 판매자 계좌 인증 필수 */
  private boolean requirePayoutAccountForEscrow = true;

  public int inspectionHoursFor(TradeMethodName method) {
    return method == TradeMethodName.door
        ? inspectionDeadlineHoursDoor
        : inspectionDeadlineHoursShipping;
  }

  public enum TradeMethodName {
    meet,
    shipping,
    door
  }
}
