package app.villager.dto;

/** 1원 인증 요청 응답 (mock: 입금자명·인증번호 시뮬레이션) */
public record PayoutVerificationSendDto(
    String depositorName,
    int depositAmount,
    String message,
    /** mock 모드에서만 — 입금자명 끝 4자리와 동일 */
    String mockVerificationCode) {}
