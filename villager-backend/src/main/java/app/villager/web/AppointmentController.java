package app.villager.web;

import app.villager.dto.AppointmentDto;
import app.villager.dto.ProposeAppointmentRequest;
import app.villager.security.CurrentUser;
import app.villager.service.AppointmentService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations/{conversationId}/appointment")
public class AppointmentController {

  private final AppointmentService appointmentService;
  private final CurrentUser currentUser;

  public AppointmentController(AppointmentService appointmentService, CurrentUser currentUser) {
    this.appointmentService = appointmentService;
    this.currentUser = currentUser;
  }

  @GetMapping
  AppointmentDto get(Authentication auth, @PathVariable UUID conversationId) {
    return appointmentService.getActive(conversationId, currentUser.requireUserId(auth));
  }

  @PostMapping("/propose")
  AppointmentDto propose(
      Authentication auth,
      @PathVariable UUID conversationId,
      @Valid @RequestBody ProposeAppointmentRequest request) {
    return appointmentService.propose(conversationId, currentUser.requireUserId(auth), request);
  }

  @PostMapping("/confirm")
  AppointmentDto confirm(Authentication auth, @PathVariable UUID conversationId) {
    return appointmentService.confirm(conversationId, currentUser.requireUserId(auth));
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void reset(Authentication auth, @PathVariable UUID conversationId) {
    appointmentService.reset(conversationId, currentUser.requireUserId(auth));
  }
}
