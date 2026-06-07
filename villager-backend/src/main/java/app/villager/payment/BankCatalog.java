package app.villager.payment;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** 국내 은행 코드 (정산 계좌 등록용) */
public final class BankCatalog {

  private static final Map<String, String> BANKS = new LinkedHashMap<>();

  static {
    BANKS.put("004", "KB국민");
    BANKS.put("088", "신한");
    BANKS.put("020", "우리");
    BANKS.put("081", "하나");
    BANKS.put("011", "NH농협");
    BANKS.put("090", "카카오뱅크");
    BANKS.put("092", "토스뱅크");
    BANKS.put("003", "IBK기업");
    BANKS.put("023", "SC제일");
    BANKS.put("027", "한국씨티");
    BANKS.put("039", "경남");
    BANKS.put("034", "광주");
  }

  private BankCatalog() {}

  public static Map<String, String> all() {
    return Map.copyOf(BANKS);
  }

  public static String resolveName(String bankCode) {
    return Optional.ofNullable(BANKS.get(bankCode))
        .orElseThrow(() -> new IllegalArgumentException("지원하지 않는 은행입니다."));
  }

  public static boolean isSupported(String bankCode) {
    return bankCode != null && BANKS.containsKey(bankCode);
  }
}
