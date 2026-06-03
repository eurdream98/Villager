package app.villager.service;

import app.villager.domain.TradeConversation;
import app.villager.domain.TradeMessage;
import app.villager.dto.MessageDto;
import app.villager.dto.SendMessageRequest;
import app.villager.repository.TradeConversationRepository;
import app.villager.repository.TradeMessageRepository;
import app.villager.util.TimeFormatUtil;
import app.villager.websocket.ChatEventPublisher;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

  private final TradeMessageRepository messageRepository;
  private final TradeConversationRepository conversationRepository;
  private final ConversationService conversationService;
  private final ProfileService profileService;
  private final ChatEventPublisher chatEventPublisher;

  public MessageService(
      TradeMessageRepository messageRepository,
      TradeConversationRepository conversationRepository,
      ConversationService conversationService,
      ProfileService profileService,
      ChatEventPublisher chatEventPublisher) {
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
    this.conversationService = conversationService;
    this.profileService = profileService;
    this.chatEventPublisher = chatEventPublisher;
  }

  @Transactional(readOnly = true)
  public List<MessageDto> list(UUID conversationId, UUID userId) {
    conversationService.requireParticipant(conversationId, userId);
    return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
        .map(this::toDto)
        .toList();
  }

  @Transactional
  public MessageDto send(UUID conversationId, UUID senderId, SendMessageRequest request) {
    TradeConversation conversation = conversationService.requireParticipant(conversationId, senderId);

    TradeMessage message = new TradeMessage();
    message.setId(UUID.randomUUID());
    message.setConversationId(conversationId);
    message.setSenderId(senderId);
    message.setBody(request.text().trim());
    message.setSystem(false);
    message.setCreatedAt(Instant.now());
    messageRepository.save(message);

    conversation.setUpdatedAt(Instant.now());
    conversationRepository.save(conversation);

    MessageDto dto = toDto(message);
    chatEventPublisher.publishMessage(dto);
    return dto;
  }

  @Transactional
  public MessageDto sendSystem(UUID conversationId, UUID senderId, String body) {
    TradeConversation conversation = conversationRepository.findById(conversationId).orElse(null);
    TradeMessage message = new TradeMessage();
    message.setId(UUID.randomUUID());
    message.setConversationId(conversationId);
    message.setSenderId(senderId);
    message.setBody(body);
    message.setSystem(true);
    message.setCreatedAt(Instant.now());
    messageRepository.save(message);

    if (conversation != null) {
      conversation.setUpdatedAt(Instant.now());
      conversationRepository.save(conversation);
    }

    MessageDto dto = toDto(message);
    chatEventPublisher.publishMessage(dto);
    return dto;
  }

  private MessageDto toDto(TradeMessage message) {
    String userName = message.getSenderId() != null
        ? profileService.displayName(message.getSenderId())
        : "시스템";
    return new MessageDto(
        message.getId(),
        message.getConversationId(),
        message.getSenderId(),
        userName,
        message.getBody(),
        message.isSystem(),
        TimeFormatUtil.iso(message.getCreatedAt()));
  }
}
