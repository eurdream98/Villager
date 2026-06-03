package app.villager.repository;

import app.villager.domain.AppointmentStatus;
import app.villager.domain.TradeAppointment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeAppointmentRepository extends JpaRepository<TradeAppointment, UUID> {

  Optional<TradeAppointment> findFirstByConversationIdAndStatusInOrderByCreatedAtDesc(
      UUID conversationId, List<AppointmentStatus> statuses);

  List<TradeAppointment> findByConversationIdAndStatusIn(
      UUID conversationId, List<AppointmentStatus> statuses);

  List<TradeAppointment> findByConversationIdInAndStatusInOrderByUpdatedAtDesc(
      List<UUID> conversationIds, List<AppointmentStatus> statuses);
}
