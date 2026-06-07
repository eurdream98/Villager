package app.villager.dto;

/** 판매자 정산 계좌 (계좌번호 마스킹) */
public record PayoutAccountDto(
    String bankCode,
    String bankName,
    String accountNumberMasked,
    String accountHolder,
    String status,
    String verifiedAt,
    boolean verificationSent) {}
