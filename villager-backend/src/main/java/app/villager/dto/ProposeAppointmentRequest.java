package app.villager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record ProposeAppointmentRequest(
    @NotBlank String tradeMethod,
    @NotNull Instant scheduledAt,
    @NotBlank @Size(max = 200) String location) {}
