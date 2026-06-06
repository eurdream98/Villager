package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** 토스 결제 성공 리다이렉트 후 서버 승인 */
public record ConfirmPaymentRequest(
    @NotBlank String paymentKey,
    @NotBlank String orderId,
    @NotNull Integer amount) {}
