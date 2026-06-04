package app.villager.service;

import app.villager.config.EscrowProperties;
import app.villager.domain.EscrowStatus;
import app.villager.domain.ListingStatus;
import app.villager.domain.SettlementType;
import app.villager.domain.TradeAppointment;
import app.villager.domain.TradeConversation;
import app.villager.domain.TradeListing;
import app.villager.domain.TradeMethod;
import app.villager.domain.TradeOrder;
import app.villager.dto.ProposeSettlementRequest;
import app.villager.dto.TradeOrderDto;
import app.villager.repository.TradeConversationRepository;
import app.villager.repository.TradeListingRepository;
import app.villager.repository.TradeOrderRepository;
import app.villager.util.TimeFormatUtil;
import app.villager.websocket.ChatEventPublisher;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EscrowService {

  private static final List<EscrowStatus> ACTIVE_ESCROW =
      List.of(
          EscrowStatus.pending_payment,
          EscrowStatus.paid_held,
          EscrowStatus.seller_fulfilled,
          EscrowStatus.buyer_confirmed,
          EscrowStatus.disputed);

  private final TradeOrderRepository orderRepository;
  private final TradeConversationRepository conversationRepository;
  private final TradeListingRepository listingRepository;
  private final ConversationService conversationService;
  private final MessageService messageService;
  private final ProfileService profileService;
  private final ChatEventPublisher chatEventPublisher;
  private final EscrowProperties escrowProperties;
  private final XpService xpService;

  public EscrowService(
      TradeOrderRepository orderRepository,
      TradeConversationRepository conversationRepository,
      TradeListingRepository listingRepository,
      ConversationService conversationService,
      MessageService messageService,
      ProfileService profileService,
      ChatEventPublisher chatEventPublisher,
      EscrowProperties escrowProperties,
      XpService xpService) {
    this.orderRepository = orderRepository;
    this.conversationRepository = conversationRepository;
    this.listingRepository = listingRepository;
    this.conversationService = conversationService;
    this.messageService = messageService;
    this.profileService = profileService;
    this.chatEventPublisher = chatEventPublisher;
    this.escrowProperties = escrowProperties;
    this.xpService = xpService;
  }

  @Transactional(readOnly = true)
  public TradeOrderDto getOrder(UUID conversationId, UUID userId) {
    conversationService.requireParticipant(conversationId, userId);
    return orderRepository
        .findByConversationId(conversationId)
        .map(this::toDto)
        .orElse(null);
  }

  @Transactional
  public void onAppointmentConfirmed(UUID conversationId, TradeAppointment appointment) {
    TradeConversation conversation = conversationRepository
        .findById(conversationId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
    TradeListing listing = listingRepository
        .findById(conversation.getListingId())
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."));

    if (listing.isFree()) {
      messageService.sendSystem(
          conversationId,
          appointment.getConfirmedBy(),
          "🎁 무료 나눔은 결제·에스크로 없이 진행됩니다. 약속 장소에서 인수해 주세요.");
      return;
    }

    if (appointment.getTradeMethod() == TradeMethod.meet) {
      messageService.sendSystem(
          conversationId,
          appointment.getConfirmedBy(),
          "🤝 만나서 거래는 현장에서 물건 확인 후 직접 결제하는 방식입니다.\n"
              + "에스크로 결제는 택배·문고리 거래에만 제공됩니다.");
      return;
    }

    Instant now = Instant.now();
    TradeOrder order = orderRepository
        .findByConversationId(conversationId)
        .orElseGet(TradeOrder::new);

    if (order.getId() == null) {
      order.setId(UUID.randomUUID());
      order.setConversationId(conversationId);
      order.setListingId(listing.getId());
      order.setBuyerId(conversation.getBuyerId());
      order.setSellerId(conversation.getSellerId());
      order.setCreatedAt(now);
    }

    order.setAppointmentId(appointment.getId());
    order.setTradeMethod(appointment.getTradeMethod());
    order.setAmount(listing.getPrice());
    order.setEscrowStatus(EscrowStatus.pending_payment);
    order.setPaymentDeadlineAt(now.plus(escrowProperties.getPaymentDeadlineHours(), ChronoUnit.HOURS));
    clearInspectionAndDispute(order);
    order.setUpdatedAt(now);
    orderRepository.save(order);

    if (listing.getStatus() == ListingStatus.active) {
      listing.setStatus(ListingStatus.reserved);
      listing.setUpdatedAt(now);
      listingRepository.save(listing);
    }

    String methodLabel = tradeMethodLabel(appointment.getTradeMethod());
    int hours = escrowProperties.getPaymentDeadlineHours();
    messageService.sendSystem(
        conversationId,
        appointment.getConfirmedBy(),
        "💳 " + methodLabel + " 에스크로 결제가 시작되었습니다.\n"
            + "구매자는 " + hours + "시간 이내에 "
            + formatWon(listing.getPrice()) + "을 결제해 주세요.\n"
            + "기한 내 미결제 시 약속·주문이 자동 취소됩니다.");

    publishOrder(conversationId, order);
  }

  @Transactional
  public void onAppointmentReset(UUID conversationId, UUID userId) {
    orderRepository.findByConversationId(conversationId).ifPresent(order -> {
      if (order.getEscrowStatus() == EscrowStatus.paid_held
          || order.getEscrowStatus() == EscrowStatus.seller_fulfilled
          || order.getEscrowStatus() == EscrowStatus.buyer_confirmed
          || order.getEscrowStatus() == EscrowStatus.disputed) {
        refundOrder(order, userId, "약속 재설정으로 인한 환불");
      } else if (ACTIVE_ESCROW.contains(order.getEscrowStatus())) {
        cancelOrder(order, userId, "약속이 다시 잡혀 주문이 취소되었습니다.");
      }
    });
  }

  @Transactional
  public TradeOrderDto pay(UUID conversationId, UUID userId) {
    TradeOrder order = requireOrder(conversationId, userId);
    requireBuyer(order, userId);
    requireStatus(order, EscrowStatus.pending_payment);

    if (order.getPaymentDeadlineAt() != null && Instant.now().isAfter(order.getPaymentDeadlineAt())) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "결제 기한이 지났습니다. 약속을 다시 잡아 주세요.");
    }

    if (!escrowProperties.isMockPaymentEnabled()) {
      throw new BusinessException(
          HttpStatus.NOT_IMPLEMENTED, "실제 PG 연동 전입니다. villager.escrow.mock-payment-enabled=true 로 개발 모드를 사용하세요.");
    }

    Instant now = Instant.now();
    order.setEscrowStatus(EscrowStatus.paid_held);
    order.setPaidAt(now);
    order.setPaymentRef("mock-" + UUID.randomUUID());
    order.setUpdatedAt(now);
    orderRepository.save(order);

    messageService.sendSystem(
        conversationId,
        userId,
        "✅ 결제 완료 · " + formatWon(order.getAmount()) + "이 에스크로에 보관되었습니다.\n"
            + "판매자가 " + tradeMethodLabel(order.getTradeMethod()) + " 이행(발송/배치)을 완료하면 알림이 갑니다.");

    publishOrder(conversationId, order);
    return toDto(order);
  }

  @Transactional
  public TradeOrderDto fulfill(UUID conversationId, UUID userId) {
    TradeOrder order = requireOrder(conversationId, userId);
    requireSeller(order, userId);
    requireStatus(order, EscrowStatus.paid_held);

    Instant now = Instant.now();
    int autoReceiptHours = escrowProperties.getAutoReceiptConfirmHours();
    order.setEscrowStatus(EscrowStatus.seller_fulfilled);
    order.setFulfilledAt(now);
    order.setReceiptConfirmDeadlineAt(now.plus(autoReceiptHours, ChronoUnit.HOURS));
    order.setUpdatedAt(now);
    orderRepository.save(order);

    String action = order.getTradeMethod() == TradeMethod.shipping ? "발송" : "배치";
    messageService.sendSystem(
        conversationId,
        userId,
        "📦 판매자가 " + action + " 완료를 알렸습니다.\n"
            + "구매자는 물건을 받은 뒤 「수령 확인」을 눌러 주세요.\n"
            + autoReceiptHours + "시간 내 미확인 시 수령이 자동 확정되고 검수 기간이 시작됩니다.");

    publishOrder(conversationId, order);
    return toDto(order);
  }

  @Transactional
  public TradeOrderDto confirmReceipt(UUID conversationId, UUID userId) {
    TradeOrder order = requireOrder(conversationId, userId);
    requireBuyer(order, userId);
    requireStatus(order, EscrowStatus.seller_fulfilled);

    applyBuyerConfirmed(order, Instant.now(), userId, false);
    publishOrder(conversationId, order);
    return toDto(order);
  }

  @Transactional
  public TradeOrderDto complete(UUID conversationId, UUID userId) {
    TradeOrder order = requireOrder(conversationId, userId);
    requireBuyer(order, userId);
    requireStatus(order, EscrowStatus.buyer_confirmed);

    releaseToSeller(order, userId, order.getAmount(), "구매자가 거래 완료를 확인했습니다.");
    publishOrder(conversationId, order);
    return toDto(order);
  }

  @Transactional
  public TradeOrderDto openDispute(UUID conversationId, UUID userId, String reason, String detail) {
    TradeOrder order = requireOrder(conversationId, userId);
    requireBuyer(order, userId);
    requireStatus(order, EscrowStatus.buyer_confirmed);

    Instant now = Instant.now();
    order.setEscrowStatus(EscrowStatus.disputed);
    order.setDisputedAt(now);
    order.setDisputeReason(reason.trim());
    order.setDisputeDetail(detail != null ? detail.trim() : null);
    order.setInspectionDeadlineAt(null);
    clearPendingSettlement(order);
    order.setUpdatedAt(now);
    orderRepository.save(order);

    messageService.sendSystem(
        conversationId,
        userId,
        "⚠️ 문제 신고: " + reason + "\n"
            + "결제 금액은 보류되며 자동 정산이 중단됩니다.\n"
            + "채팅으로 합의한 뒤 「합의안 제안 → 상대방 수락」으로 마무리해 주세요.");

    publishOrder(conversationId, order);
    return toDto(order);
  }

  @Transactional
  public TradeOrderDto proposeSettlement(
      UUID conversationId, UUID userId, ProposeSettlementRequest request) {
    TradeOrder order = requireOrder(conversationId, userId);
    requireParticipant(order, userId);
    if (order.getEscrowStatus() != EscrowStatus.disputed
        && order.getEscrowStatus() != EscrowStatus.buyer_confirmed) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "합의안을 제안할 수 있는 상태가 아닙니다.");
    }

    SettlementType type = parseSettlementType(request.type());
    int refundAmount = resolveRefundAmount(order, type, request.refundAmount());
    int sellerAmount = order.getAmount() - refundAmount;

    Instant now = Instant.now();
    order.setPendingSettlementType(type.name());
    order.setPendingSettlementAmount(refundAmount);
    order.setPendingSettlementBy(userId);
    order.setPendingSettlementAt(now);
    order.setUpdatedAt(now);
    orderRepository.save(order);

    String summary = settlementSummary(type, order.getAmount(), refundAmount, sellerAmount);
    messageService.sendSystem(
        conversationId,
        userId,
        "📝 합의안 제안: " + summary + "\n"
            + (request.notes() != null && !request.notes().isBlank() ? request.notes() + "\n" : "")
            + "상대방이 「합의 수락」을 누르면 최종 정산이 진행됩니다.");

    publishOrder(conversationId, order);
    return toDto(order);
  }

  @Transactional
  public TradeOrderDto acceptSettlement(UUID conversationId, UUID userId) {
    TradeOrder order = requireOrder(conversationId, userId);
    requireParticipant(order, userId);

    if (order.getPendingSettlementType() == null || order.getPendingSettlementBy() == null) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "수락할 합의안이 없습니다.");
    }
    if (order.getPendingSettlementBy().equals(userId)) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "본인이 제안한 합의안은 직접 수락할 수 없습니다.");
    }

    SettlementType type = parseSettlementType(order.getPendingSettlementType());
    int refundAmount = order.getPendingSettlementAmount() != null ? order.getPendingSettlementAmount() : 0;
    int sellerAmount = order.getAmount() - refundAmount;

    switch (type) {
      case keep_full -> releaseToSeller(order, userId, order.getAmount(), "합의: 정상 거래로 판매자에게 전액 정산");
      case return_refund -> refundOrder(order, userId, "합의: 반품 후 전액 환불");
      case partial_refund -> {
        if (refundAmount <= 0 || refundAmount >= order.getAmount()) {
          throw new BusinessException(HttpStatus.BAD_REQUEST, "부분 환불 금액이 올바르지 않습니다.");
        }
        partialSettle(order, userId, sellerAmount, refundAmount);
      }
    }

    clearPendingSettlement(order);
    publishOrder(conversationId, order);
    return toDto(order);
  }

  @Transactional
  public void processExpiredPaymentDeadlines() {
    List<TradeOrder> expired = orderRepository.findByEscrowStatusAndPaymentDeadlineAtBefore(
        EscrowStatus.pending_payment, Instant.now());
    for (TradeOrder order : expired) {
      cancelOrder(order, order.getBuyerId(), "결제 기한(" + escrowProperties.getPaymentDeadlineHours() + "시간) 초과로 주문이 취소되었습니다.");
      publishOrder(order.getConversationId(), order);
    }
  }

  @Transactional
  public void processAutoConfirmDeadlines() {
    List<TradeOrder> expired = orderRepository.findByEscrowStatusAndInspectionDeadlineAtBefore(
        EscrowStatus.buyer_confirmed, Instant.now());
    for (TradeOrder order : expired) {
      releaseToSeller(order, order.getBuyerId(), order.getAmount(), "검수 기간 만료로 자동 정산되었습니다.");
      publishOrder(order.getConversationId(), order);
    }
  }

  /** 판매자 이행 후 구매자가 수령 확인하지 않으면 검수 타이머 시작 */
  @Transactional
  public void processAutoReceiptConfirm() {
    List<TradeOrder> expired = orderRepository.findByEscrowStatusAndReceiptConfirmDeadlineAtBefore(
        EscrowStatus.seller_fulfilled, Instant.now());
    for (TradeOrder order : expired) {
      applyBuyerConfirmed(order, Instant.now(), order.getBuyerId(), true);
      publishOrder(order.getConversationId(), order);
    }
  }

  private void applyBuyerConfirmed(TradeOrder order, Instant now, UUID actorId, boolean auto) {
    int inspectionHours = inspectionHours(order);
    order.setEscrowStatus(EscrowStatus.buyer_confirmed);
    order.setConfirmedAt(now);
    order.setReceiptConfirmDeadlineAt(null);
    order.setInspectionDeadlineAt(now.plus(inspectionHours, ChronoUnit.HOURS));
    order.setUpdatedAt(now);
    orderRepository.save(order);

    String prefix = auto
        ? "⏱️ 수령 확인 기한이 지나 수령이 자동 확정되었습니다."
        : "📬 수령 확인되었습니다.";
    messageService.sendSystem(
        order.getConversationId(),
        actorId,
        prefix + "\n"
            + inspectionHours + "시간 이내에 「거래 완료」 또는 「문제 신고」를 선택해 주세요.\n"
            + "기한 내 조치가 없으면 자동으로 판매자에게 정산됩니다.");
  }

  private void releaseToSeller(TradeOrder order, UUID actorId, int sellerAmount, String reason) {
    Instant now = Instant.now();
    order.setEscrowStatus(EscrowStatus.released);
    order.setSettlementAmount(sellerAmount);
    order.setReleasedAt(now);
    order.setInspectionDeadlineAt(null);
    order.setUpdatedAt(now);
    orderRepository.save(order);
    markListingSold(order.getListingId(), now);

    messageService.sendSystem(
        order.getConversationId(),
        actorId,
        "🎉 거래 완료 · " + formatWon(sellerAmount) + "이 판매자에게 정산되었습니다.\n" + reason);

    xpService.addXp(order.getBuyerId(), 10);
    xpService.addXp(order.getSellerId(), 10);
  }

  private void refundOrder(TradeOrder order, UUID actorId, String reason) {
    Instant now = Instant.now();
    order.setEscrowStatus(EscrowStatus.refunded);
    order.setSettlementAmount(0);
    order.setRefundedAt(now);
    order.setInspectionDeadlineAt(null);
    order.setUpdatedAt(now);
    orderRepository.save(order);
    reopenListing(order.getListingId(), now);

    messageService.sendSystem(
        order.getConversationId(),
        actorId,
        "↩️ " + formatWon(order.getAmount()) + " 전액 환불 처리되었습니다.\n" + reason);
  }

  private void partialSettle(TradeOrder order, UUID actorId, int sellerAmount, int refundAmount) {
    Instant now = Instant.now();
    order.setEscrowStatus(EscrowStatus.released);
    order.setSettlementAmount(sellerAmount);
    order.setReleasedAt(now);
    order.setRefundedAt(now);
    order.setInspectionDeadlineAt(null);
    order.setUpdatedAt(now);
    orderRepository.save(order);
    markListingSold(order.getListingId(), now);

    messageService.sendSystem(
        order.getConversationId(),
        actorId,
        "🤝 합의 완료 · 판매자 정산 " + formatWon(sellerAmount)
            + ", 구매자 환불 " + formatWon(refundAmount));

    xpService.addXp(order.getBuyerId(), 10);
    xpService.addXp(order.getSellerId(), 10);
  }

  private void cancelOrder(TradeOrder order, UUID actorId, String reason) {
    Instant now = Instant.now();
    order.setEscrowStatus(EscrowStatus.cancelled);
    order.setUpdatedAt(now);
    orderRepository.save(order);
    reopenListing(order.getListingId(), now);
    messageService.sendSystem(order.getConversationId(), actorId, "❌ " + reason);
  }

  private void markListingSold(UUID listingId, Instant now) {
    listingRepository.findById(listingId).ifPresent(listing -> {
      listing.setStatus(ListingStatus.sold);
      listing.setUpdatedAt(now);
      listingRepository.save(listing);
    });
  }

  private void reopenListing(UUID listingId, Instant now) {
    listingRepository.findById(listingId).ifPresent(listing -> {
      if (listing.getStatus() == ListingStatus.reserved || listing.getStatus() == ListingStatus.sold) {
        listing.setStatus(ListingStatus.active);
        listing.setUpdatedAt(now);
        listingRepository.save(listing);
      }
    });
  }

  private TradeOrder requireOrder(UUID conversationId, UUID userId) {
    conversationService.requireParticipant(conversationId, userId);
    return orderRepository
        .findByConversationId(conversationId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "에스크로 주문이 없습니다."));
  }

  private void requireBuyer(TradeOrder order, UUID userId) {
    if (!order.getBuyerId().equals(userId)) {
      throw new BusinessException(HttpStatus.FORBIDDEN, "구매자만 수행할 수 있습니다.");
    }
  }

  private void requireSeller(TradeOrder order, UUID userId) {
    if (!order.getSellerId().equals(userId)) {
      throw new BusinessException(HttpStatus.FORBIDDEN, "판매자만 수행할 수 있습니다.");
    }
  }

  private void requireParticipant(TradeOrder order, UUID userId) {
    if (!order.getBuyerId().equals(userId) && !order.getSellerId().equals(userId)) {
      throw new BusinessException(HttpStatus.FORBIDDEN, "참여자만 수행할 수 있습니다.");
    }
  }

  private void requireStatus(TradeOrder order, EscrowStatus expected) {
    if (order.getEscrowStatus() != expected) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "현재 상태에서는 이 작업을 할 수 없습니다.");
    }
  }

  private SettlementType parseSettlementType(String raw) {
    try {
      return SettlementType.valueOf(raw);
    } catch (IllegalArgumentException ex) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "지원하지 않는 합의 유형입니다.");
    }
  }

  private int resolveRefundAmount(TradeOrder order, SettlementType type, Integer requested) {
    return switch (type) {
      case keep_full -> 0;
      case return_refund -> order.getAmount();
      case partial_refund -> {
        if (requested == null || requested <= 0 || requested >= order.getAmount()) {
          throw new BusinessException(
              HttpStatus.BAD_REQUEST, "부분 환불 금액(1~" + (order.getAmount() - 1) + ")을 입력해 주세요.");
        }
        yield requested;
      }
    };
  }

  private String settlementSummary(SettlementType type, int amount, int refund, int seller) {
    return switch (type) {
      case keep_full -> "그대로 구매 (판매자 " + formatWon(amount) + ")";
      case return_refund -> "반품 후 전액 환불 (" + formatWon(amount) + ")";
      case partial_refund -> "부분 환불 " + formatWon(refund) + " · 판매자 정산 " + formatWon(seller);
    };
  }

  private int inspectionHours(TradeOrder order) {
    return order.getTradeMethod() == TradeMethod.door
        ? escrowProperties.getInspectionDeadlineHoursDoor()
        : escrowProperties.getInspectionDeadlineHoursShipping();
  }

  private void clearInspectionAndDispute(TradeOrder order) {
    order.setPaidAt(null);
    order.setFulfilledAt(null);
    order.setConfirmedAt(null);
    order.setReleasedAt(null);
    order.setRefundedAt(null);
    order.setInspectionDeadlineAt(null);
    order.setReceiptConfirmDeadlineAt(null);
    order.setDisputedAt(null);
    order.setDisputeReason(null);
    order.setDisputeDetail(null);
    order.setSettlementAmount(null);
    order.setPaymentRef(null);
    clearPendingSettlement(order);
  }

  private void clearPendingSettlement(TradeOrder order) {
    order.setPendingSettlementType(null);
    order.setPendingSettlementAmount(null);
    order.setPendingSettlementBy(null);
    order.setPendingSettlementAt(null);
  }

  private String tradeMethodLabel(TradeMethod method) {
    return switch (method) {
      case meet -> "만나서 직접 거래";
      case shipping -> "택배 거래";
      case door -> "문고리 거래";
    };
  }

  private String formatWon(int amount) {
    return String.format("%,d원", amount);
  }

  private void publishOrder(UUID conversationId, TradeOrder order) {
    chatEventPublisher.publishOrder(conversationId, toDto(order));
  }

  private TradeOrderDto toDto(TradeOrder order) {
    boolean enabled = order.getEscrowStatus() != EscrowStatus.none;
    int inspectionHours = inspectionHours(order);
    return new TradeOrderDto(
        order.getId(),
        order.getConversationId(),
        order.getListingId(),
        order.getBuyerId(),
        order.getSellerId(),
        order.getAppointmentId(),
        order.getTradeMethod().name(),
        order.getAmount(),
        order.getEscrowStatus().name(),
        TimeFormatUtil.iso(order.getPaidAt()),
        TimeFormatUtil.iso(order.getFulfilledAt()),
        TimeFormatUtil.iso(order.getConfirmedAt()),
        TimeFormatUtil.iso(order.getReleasedAt()),
        TimeFormatUtil.iso(order.getRefundedAt()),
        TimeFormatUtil.iso(order.getPaymentDeadlineAt()),
        TimeFormatUtil.iso(order.getInspectionDeadlineAt()),
        TimeFormatUtil.iso(order.getReceiptConfirmDeadlineAt()),
        TimeFormatUtil.iso(order.getDisputedAt()),
        order.getDisputeReason(),
        order.getDisputeDetail(),
        order.getSettlementAmount(),
        order.getPendingSettlementType(),
        order.getPendingSettlementAmount(),
        order.getPendingSettlementBy(),
        order.getPendingSettlementBy() != null
            ? profileService.displayName(order.getPendingSettlementBy())
            : null,
        TimeFormatUtil.iso(order.getPendingSettlementAt()),
        order.getPaymentRef(),
        enabled,
        escrowProperties.getPaymentDeadlineHours(),
        inspectionHours,
        escrowProperties.getAutoReceiptConfirmHours());
  }
}
