package app.villager.dto;

import java.util.UUID;

/** 프론트 결제창(토스 SDK) 또는 mock 분기용 */
public record PaymentPrepareDto(
    /** mock | toss */
    String mode,
    String clientKey,
    String orderId,
    int amount,
    String orderName,
    UUID conversationId,
    UUID customerKey,
    String successUrl,
    String failUrl) {}
