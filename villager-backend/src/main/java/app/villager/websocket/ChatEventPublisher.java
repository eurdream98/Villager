package app.villager.websocket;

import java.util.UUID;
import app.villager.dto.AppointmentDto;
import app.villager.dto.MessageDto;
import app.villager.dto.TradeOrderDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class ChatEventPublisher {

  private final SimpMessagingTemplate messagingTemplate;

  public ChatEventPublisher(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  public void publishMessage(MessageDto message) {
    messagingTemplate.convertAndSend(
        "/topic/conversations." + message.conversationId(),
        message);
  }

  public void publishAppointment(UUID conversationId, AppointmentDto appointment) {
    messagingTemplate.convertAndSend(
        "/topic/conversations." + conversationId + ".appointment",
        appointment);
  }

  public void publishOrder(UUID conversationId, TradeOrderDto order) {
    messagingTemplate.convertAndSend(
        "/topic/conversations." + conversationId + ".order",
        order);
  }
}
