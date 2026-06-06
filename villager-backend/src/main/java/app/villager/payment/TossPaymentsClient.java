package app.villager.payment;

import app.villager.config.TossPaymentsProperties;
import app.villager.service.BusinessException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/** 토스페이먼츠 결제 승인·취소(환불) API */
@Service
public class TossPaymentsClient {

  private final TossPaymentsProperties properties;
  private final RestClient restClient;

  public TossPaymentsClient(TossPaymentsProperties properties) {
    this.properties = properties;
    this.restClient = RestClient.create();
  }

  /** 결제창 인증 후 paymentKey로 최종 승인 */
  public TossConfirmResult confirm(String paymentKey, String orderId, int amount) {
    requireConfigured();
    try {
      TossConfirmResponse body =
          restClient
              .post()
              .uri(properties.getApiBaseUrl() + "/v1/payments/confirm")
              .header("Authorization", basicAuth())
              .contentType(MediaType.APPLICATION_JSON)
              .body(Map.of("paymentKey", paymentKey, "orderId", orderId, "amount", amount))
              .retrieve()
              .body(TossConfirmResponse.class);
      if (body == null || body.paymentKey() == null) {
        throw new BusinessException(HttpStatus.BAD_GATEWAY, "토스 결제 승인 응답이 비어 있습니다.");
      }
      return new TossConfirmResult(body.paymentKey(), body.orderId(), body.totalAmount());
    } catch (RestClientResponseException ex) {
      throw new BusinessException(
          HttpStatus.BAD_GATEWAY, "토스 결제 승인 실패: " + summarizeTossError(ex));
    }
  }

  /** 전액 또는 부분 환불 */
  public void cancel(String paymentKey, String cancelReason, Integer cancelAmount) {
    requireConfigured();
    try {
      Map<String, Object> body =
          cancelAmount != null
              ? Map.of("cancelReason", cancelReason, "cancelAmount", cancelAmount)
              : Map.of("cancelReason", cancelReason);

      restClient
          .post()
          .uri(properties.getApiBaseUrl() + "/v1/payments/" + paymentKey + "/cancel")
          .header("Authorization", basicAuth())
          .contentType(MediaType.APPLICATION_JSON)
          .body(body)
          .retrieve()
          .toBodilessEntity();
    } catch (RestClientResponseException ex) {
      throw new BusinessException(
          HttpStatus.BAD_GATEWAY, "토스 환불 실패: " + summarizeTossError(ex));
    }
  }

  private void requireConfigured() {
    if (!properties.isConfigured()) {
      throw new BusinessException(HttpStatus.NOT_IMPLEMENTED, "토스페이먼츠가 설정되지 않았습니다.");
    }
  }

  private String basicAuth() {
    String raw = properties.getSecretKey() + ":";
    return "Basic "
        + Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  private static String summarizeTossError(RestClientResponseException ex) {
    String body = ex.getResponseBodyAsString();
    if (body != null && body.length() > 200) {
      return body.substring(0, 200) + "…";
    }
    return body != null ? body : String.valueOf(ex.getStatusCode().value());
  }

  public record TossConfirmResult(String paymentKey, String orderId, int totalAmount) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  record TossConfirmResponse(
      @JsonProperty("paymentKey") String paymentKey,
      @JsonProperty("orderId") String orderId,
      @JsonProperty("totalAmount") int totalAmount) {}
}
