package app.villager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "villager.toss")
public class TossPaymentsProperties {

  /** true + client/secret key 설정 시 토스 결제창 사용 */
  private boolean enabled = false;

  private String clientKey = "";

  private String secretKey = "";

  private String apiBaseUrl = "https://api.tosspayments.com";

  /** 프론트 결제 성공 리다이렉트 베이스 (쿼리는 서버·SDK에서 붙임) */
  private String successUrl = "http://localhost:3000/payment-success.html";

  private String failUrl = "http://localhost:3000/payment-fail.html";

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getClientKey() {
    return clientKey;
  }

  public void setClientKey(String clientKey) {
    this.clientKey = clientKey;
  }

  public String getSecretKey() {
    return secretKey;
  }

  public void setSecretKey(String secretKey) {
    this.secretKey = secretKey;
  }

  public String getApiBaseUrl() {
    return apiBaseUrl;
  }

  public void setApiBaseUrl(String apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  public String getSuccessUrl() {
    return successUrl;
  }

  public void setSuccessUrl(String successUrl) {
    this.successUrl = successUrl;
  }

  public String getFailUrl() {
    return failUrl;
  }

  public void setFailUrl(String failUrl) {
    this.failUrl = failUrl;
  }

  public boolean isConfigured() {
    return enabled
        && clientKey != null
        && !clientKey.isBlank()
        && secretKey != null
        && !secretKey.isBlank();
  }
}
