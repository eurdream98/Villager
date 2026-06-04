package app.villager.web;

import app.villager.dto.ConversationSummaryDto;
import app.villager.dto.CreateListingRequest;
import app.villager.dto.ListingDto;
import app.villager.security.CurrentUser;
import app.villager.service.ConversationService;
import app.villager.service.ListingImageService;
import app.villager.service.ListingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/listings")
public class ListingController {

  private final ListingService listingService;
  private final ListingImageService listingImageService;
  private final ConversationService conversationService;
  private final CurrentUser currentUser;

  public ListingController(
      ListingService listingService,
      ListingImageService listingImageService,
      ConversationService conversationService,
      CurrentUser currentUser) {
    this.listingService = listingService;
    this.listingImageService = listingImageService;
    this.conversationService = conversationService;
    this.currentUser = currentUser;
  }

  @GetMapping
  List<ListingDto> list(Authentication auth) {
    UUID userId = currentUser.optionalUserId(auth).orElse(null);
    return listingService.listActive(userId);
  }

  @GetMapping("/{id}")
  ListingDto get(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.optionalUserId(auth).orElse(null);
    return listingService.getActive(id, userId);
  }

  /** 이 상품과 연결된 거래 채팅 (판매자: 전체, 구매자: 본인 방만) */
  @GetMapping("/{id}/conversations")
  List<ConversationSummaryDto> listingConversations(Authentication auth, @PathVariable UUID id) {
    UUID userId = currentUser.requireUserId(auth);
    return conversationService.listByListing(id, userId);
  }

  @PostMapping
  ListingDto create(Authentication auth, @Valid @RequestBody CreateListingRequest request) {
    UUID userId = currentUser.requireUserId(auth);
    return listingService.create(userId, request);
  }

  /** 판매 사진 업로드 — 공개 URL 목록 반환 */
  @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  List<String> uploadImages(
      Authentication auth, @RequestParam("files") MultipartFile[] files) {
    UUID userId = currentUser.requireUserId(auth);
    return listingImageService.upload(userId, files);
  }
}
