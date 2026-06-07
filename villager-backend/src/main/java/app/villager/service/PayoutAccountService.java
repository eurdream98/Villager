package app.villager.service;

import app.villager.config.EscrowProperties;
import app.villager.domain.PayoutAccountStatus;
import app.villager.domain.SellerPayoutAccount;
import app.villager.dto.PayoutAccountDto;
import app.villager.dto.PayoutVerificationSendDto;
import app.villager.dto.RegisterPayoutAccountRequest;
import app.villager.payment.BankCatalog;
import app.villager.repository.SellerPayoutAccountRepository;
import app.villager.util.TimeFormatUtil;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayoutAccountService {

  private static final SecureRandom RANDOM = new SecureRandom();
  private static final String DEPOSITOR_PREFIX = "VLRG";

  private final SellerPayoutAccountRepository repository;
  private final EscrowProperties escrowProperties;

  public PayoutAccountService(
      SellerPayoutAccountRepository repository, EscrowProperties escrowProperties) {
    this.repository = repository;
    this.escrowProperties = escrowProperties;
  }

  @Transactional(readOnly = true)
  public PayoutAccountDto getAccount(UUID userId) {
    return repository.findById(userId).map(this::toDto).orElse(null);
  }

  @Transactional(readOnly = true)
  public boolean hasVerifiedAccount(UUID userId) {
    return repository
        .findByUserIdAndStatus(userId, PayoutAccountStatus.verified)
        .isPresent();
  }

  /** 정산(mock) 메시지용 — 인증된 계좌 요약 */
  @Transactional(readOnly = true)
  public Optional<String> describeVerifiedAccount(UUID userId) {
    return repository
        .findByUserIdAndStatus(userId, PayoutAccountStatus.verified)
        .map(a -> a.getBankName() + " " + maskAccountNumber(a.getAccountNumber()));
  }

  @Transactional
  public PayoutAccountDto register(UUID userId, RegisterPayoutAccountRequest request) {
    if (!BankCatalog.isSupported(request.bankCode())) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "지원하지 않는 은행입니다.");
    }

    String holder = request.accountHolder().trim();
    if (holder.isBlank()) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "예금주명을 입력해 주세요.");
    }

    Instant now = Instant.now();
    SellerPayoutAccount account = repository.findById(userId).orElseGet(SellerPayoutAccount::new);

    if (account.getUserId() == null) {
      account.setUserId(userId);
      account.setCreatedAt(now);
    }

    account.setBankCode(request.bankCode());
    account.setBankName(BankCatalog.resolveName(request.bankCode()));
    account.setAccountNumber(request.accountNumber().trim());
    account.setAccountHolder(holder);
    account.setStatus(PayoutAccountStatus.pending);
    account.setVerificationCode(null);
    account.setVerificationSentAt(null);
    account.setVerifiedAt(null);
    account.setUpdatedAt(now);
    repository.save(account);

    return toDto(account);
  }

  /** 1원 인증 시뮬레이션 — 입금자명에 4자리 코드 포함 */
  @Transactional
  public PayoutVerificationSendDto sendVerification(UUID userId) {
    SellerPayoutAccount account = repository
        .findById(userId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "등록된 계좌가 없습니다."));

    if (account.getStatus() == PayoutAccountStatus.verified) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "이미 인증된 계좌입니다.");
    }

    Instant now = Instant.now();
    String code = generateVerificationCode();
    account.setVerificationCode(code);
    account.setVerificationSentAt(now);
    account.setUpdatedAt(now);
    repository.save(account);

    String depositorName = DEPOSITOR_PREFIX + code;
    String message =
        "Villager에서 1원이 입금되었습니다. 통장 입금자명 "
            + depositorName
            + " 의 끝 4자리를 입력해 주세요.";

    return new PayoutVerificationSendDto(
        depositorName,
        1,
        message,
        escrowProperties.isMockPayoutVerificationEnabled() ? code : null);
  }

  @Transactional
  public PayoutAccountDto verify(UUID userId, String code) {
    SellerPayoutAccount account = repository
        .findById(userId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "등록된 계좌가 없습니다."));

    if (account.getStatus() == PayoutAccountStatus.verified) {
      return toDto(account);
    }

    if (account.getVerificationSentAt() == null) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "먼저 「1원 인증 보내기」를 눌러 주세요.");
    }

    if (account.getVerificationCode() == null
        || !account.getVerificationCode().equals(code.trim())) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "인증번호가 올바르지 않습니다.");
    }

    Instant now = Instant.now();
    account.setStatus(PayoutAccountStatus.verified);
    account.setVerificationCode(null);
    account.setVerificationSentAt(null);
    account.setVerifiedAt(now);
    account.setUpdatedAt(now);
    repository.save(account);

    return toDto(account);
  }

  private PayoutAccountDto toDto(SellerPayoutAccount account) {
    return new PayoutAccountDto(
        account.getBankCode(),
        account.getBankName(),
        maskAccountNumber(account.getAccountNumber()),
        account.getAccountHolder(),
        account.getStatus().name(),
        TimeFormatUtil.iso(account.getVerifiedAt()),
        account.getVerificationSentAt() != null);
  }

  static String maskAccountNumber(String accountNumber) {
    if (accountNumber == null || accountNumber.length() < 4) {
      return "****";
    }
    String last4 = accountNumber.substring(accountNumber.length() - 4);
    return "****" + last4;
  }

  private static String generateVerificationCode() {
    return String.format("%04d", RANDOM.nextInt(10_000));
  }
}
