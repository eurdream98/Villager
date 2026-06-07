package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterPayoutAccountRequest(
    @NotBlank String bankCode,
    @NotBlank
        @Pattern(regexp = "^[0-9]{10,16}$", message = "계좌번호는 10~16자리 숫자여야 합니다.")
        String accountNumber,
    @NotBlank String accountHolder) {}
