package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyPayoutAccountRequest(
    @NotBlank
        @Pattern(regexp = "^[0-9]{4}$", message = "인증번호는 4자리 숫자입니다.")
        String code) {}
