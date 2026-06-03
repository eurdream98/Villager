package app.villager.service;

import app.villager.domain.AppointmentStatus;
import app.villager.domain.TradeAppointment;
import app.villager.domain.TradeConversation;
import app.villager.domain.TradeMethod;
import app.villager.dto.AppointmentDto;
import app.villager.dto.ProposeAppointmentRequest;
import app.villager.repository.TradeAppointmentRepository;
import app.villager.util.TimeFormatUtil;
import app.villager.websocket.ChatEventPublisher;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

  private static final List<AppointmentStatus> ACTIVE_STATUSES =
      List.of(AppointmentStatus.pending, AppointmentStatus.confirmed);

  private final TradeAppointmentRepository appointmentRepository;
  private final ConversationService conversationService;
  private final MessageService messageService;
  private final ProfileService profileService;
  private final ChatEventPublisher chatEventPublisher;

  public AppointmentService(
      TradeAppointmentRepository appointmentRepository,
      ConversationService conversationService,
      MessageService messageService,
      ProfileService profileService,
      ChatEventPublisher chatEventPublisher) {
    this.appointmentRepository = appointmentRepository;
    this.conversationService = conversationService;
    this.messageService = messageService;
    this.profileService = profileService;
    this.chatEventPublisher = chatEventPublisher;
  }

  @Transactional(readOnly = true)
  public AppointmentDto getActive(UUID conversationId, UUID userId) {
    conversationService.requireParticipant(conversationId, userId);
    return appointmentRepository
        .findFirstByConversationIdAndStatusInOrderByCreatedAtDesc(conversationId, ACTIVE_STATUSES)
        .map(this::toDto)
        .orElse(null);
  }

  @Transactional
  public AppointmentDto propose(UUID conversationId, UUID userId, ProposeAppointmentRequest request) {
    TradeConversation conversation = conversationService.requireParticipant(conversationId, userId);
    if (request.scheduledAt().isBefore(Instant.now().minusSeconds(60))) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "거래 시간은 현재 이후로 설정해 주세요.");
    }

    cancelActive(conversationId);

    Instant now = Instant.now();
    TradeAppointment appointment = new TradeAppointment();
    appointment.setId(UUID.randomUUID());
    appointment.setConversationId(conversationId);
    appointment.setTradeMethod(parseTradeMethod(request.tradeMethod()));
    appointment.setScheduledAt(request.scheduledAt());
    appointment.setLocation(request.location().trim());
    appointment.setStatus(AppointmentStatus.pending);
    appointment.setProposedBy(userId);
    appointment.setCreatedAt(now);
    appointment.setUpdatedAt(now);
    appointmentRepository.save(appointment);

    String systemText = buildProposedMessage(appointment);
    messageService.sendSystem(conversationId, userId, systemText);

    AppointmentDto dto = toDto(appointment);
    chatEventPublisher.publishAppointment(conversationId, dto);
    return dto;
  }

  @Transactional
  public AppointmentDto confirm(UUID conversationId, UUID userId) {
    conversationService.requireParticipant(conversationId, userId);

    TradeAppointment appointment = appointmentRepository
        .findFirstByConversationIdAndStatusInOrderByCreatedAtDesc(
            conversationId, List.of(AppointmentStatus.pending))
        .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "확정할 약속 제안이 없습니다."));

    if (appointment.getProposedBy().equals(userId)) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "본인이 제안한 약속은 직접 확정할 수 없습니다.");
    }

    appointment.setStatus(AppointmentStatus.confirmed);
    appointment.setConfirmedBy(userId);
    appointment.setConfirmedAt(Instant.now());
    appointment.setUpdatedAt(Instant.now());
    appointmentRepository.save(appointment);

    messageService.sendSystem(conversationId, userId, buildConfirmedMessage(appointment));

    AppointmentDto dto = toDto(appointment);
    chatEventPublisher.publishAppointment(conversationId, dto);
    return dto;
  }

  @Transactional
  public void reset(UUID conversationId, UUID userId) {
    conversationService.requireParticipant(conversationId, userId);
    cancelActive(conversationId);
    chatEventPublisher.publishAppointment(conversationId, null);
  }

  private void cancelActive(UUID conversationId) {
    List<TradeAppointment> active = appointmentRepository
        .findByConversationIdAndStatusIn(conversationId, ACTIVE_STATUSES);
    Instant now = Instant.now();
    for (TradeAppointment apt : active) {
      apt.setStatus(AppointmentStatus.cancelled);
      apt.setUpdatedAt(now);
      appointmentRepository.save(apt);
    }
  }

  private TradeMethod parseTradeMethod(String method) {
    try {
      return TradeMethod.valueOf(method);
    } catch (IllegalArgumentException ex) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "지원하지 않는 거래 방법입니다.");
    }
  }

  private String buildProposedMessage(TradeAppointment apt) {
    return "📅 거래 약속이 제안되었습니다.\n"
        + tradeMethodLabel(apt.getTradeMethod().name()) + " · "
        + TimeFormatUtil.relative(apt.getScheduledAt()) + "\n"
        + "장소: " + apt.getLocation();
  }

  private String buildConfirmedMessage(TradeAppointment apt) {
    return "✅ 약속 완료\n"
        + tradeMethodLabel(apt.getTradeMethod().name()) + " · "
        + TimeFormatUtil.relative(apt.getScheduledAt()) + "\n"
        + "장소: " + apt.getLocation();
  }

  private String tradeMethodLabel(String method) {
    return switch (method) {
      case "meet" -> "만나서 직접 거래";
      case "shipping" -> "택배 거래";
      case "door" -> "문고리 거래";
      default -> method;
    };
  }

  private AppointmentDto toDto(TradeAppointment apt) {
    return new AppointmentDto(
        apt.getId(),
        apt.getConversationId(),
        apt.getTradeMethod().name(),
        TimeFormatUtil.iso(apt.getScheduledAt()),
        apt.getLocation(),
        apt.getStatus().name(),
        apt.getProposedBy(),
        profileService.displayName(apt.getProposedBy()),
        apt.getConfirmedBy(),
        TimeFormatUtil.iso(apt.getConfirmedAt()));
  }
}
