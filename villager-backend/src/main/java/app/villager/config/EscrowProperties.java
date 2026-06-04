package app.villager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

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

  /** true: PG 없이 mock 결제 허용 (로컬 개발) */
  private boolean mockPaymentEnabled = true;

  public int getPaymentDeadlineHours() {
    return paymentDeadlineHours;
  }

  public void setPaymentDeadlineHours(int paymentDeadlineHours) {
    this.paymentDeadlineHours = paymentDeadlineHours;
  }

  public int getInspectionDeadlineHoursShipping() {
    return inspectionDeadlineHoursShipping;
  }

  public void setInspectionDeadlineHoursShipping(int inspectionDeadlineHoursShipping) {
    this.inspectionDeadlineHoursShipping = inspectionDeadlineHoursShipping;
  }

  public int getInspectionDeadlineHoursDoor() {
    return inspectionDeadlineHoursDoor;
  }

  public void setInspectionDeadlineHoursDoor(int inspectionDeadlineHoursDoor) {
    this.inspectionDeadlineHoursDoor = inspectionDeadlineHoursDoor;
  }

  public int getAutoReceiptConfirmHours() {
    return autoReceiptConfirmHours;
  }

  public void setAutoReceiptConfirmHours(int autoReceiptConfirmHours) {
    this.autoReceiptConfirmHours = autoReceiptConfirmHours;
  }

  public boolean isMockPaymentEnabled() {
    return mockPaymentEnabled;
  }

  public void setMockPaymentEnabled(boolean mockPaymentEnabled) {
    this.mockPaymentEnabled = mockPaymentEnabled;
  }

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
