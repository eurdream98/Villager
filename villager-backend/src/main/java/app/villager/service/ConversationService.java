package app.villager.service;

import app.villager.domain.AppointmentStatus;
import app.villager.domain.TradeAppointment;
import app.villager.domain.TradeConversation;
import app.villager.domain.TradeListing;
import app.villager.domain.TradeListingImage;
import app.villager.domain.TradeMessage;
import app.villager.dto.ConversationDto;
import app.villager.dto.ConversationSummaryDto;
import app.villager.dto.ListingTradeStatusDto;
import app.villager.repository.TradeAppointmentRepository;
import app.villager.repository.TradeConversationRepository;
import app.villager.repository.TradeListingImageRepository;
import app.villager.repository.TradeListingRepository;
import app.villager.repository.TradeMessageRepository;
import app.villager.util.TimeFormatUtil;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationService {

  private static final List<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES =
      List.of(AppointmentStatus.pending, AppointmentStatus.confirmed);

  private final TradeConversationRepository conversationRepository;
  private final TradeListingRepository listingRepository;
  private final TradeListingImageRepository imageRepository;
  private final TradeMessageRepository messageRepository;
  private final TradeAppointmentRepository appointmentRepository;
  private final ProfileService profileService;

  public ConversationService(
      TradeConversationRepository conversationRepository,
      TradeListingRepository listingRepository,
      TradeListingImageRepository imageRepository,
      TradeMessageRepository messageRepository,
      TradeAppointmentRepository appointmentRepository,
      ProfileService profileService) {
    this.conversationRepository = conversationRepository;
    this.listingRepository = listingRepository;
    this.imageRepository = imageRepository;
    this.messageRepository = messageRepository;
    this.appointmentRepository = appointmentRepository;
    this.profileService = profileService;
  }

  @Transactional
  public ConversationDto getOrCreate(UUID listingId, UUID buyerId) {
    TradeListing listing = listingRepository.findById(listingId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."));

    if (listing.getSellerId().equals(buyerId)) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "본인 상품에는 채팅을 시작할 수 없습니다.");
    }

    TradeConversation conversation = conversationRepository
        .findByListingIdAndBuyerId(listingId, buyerId)
        .orElseGet(() -> createConversation(listing, buyerId));

    return toDto(conversation, listing.getTitle(), buyerId);
  }

  @Transactional(readOnly = true)
  public TradeConversation requireParticipant(UUID conversationId, UUID userId) {
    TradeConversation conversation = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
    if (!conversation.getBuyerId().equals(userId) && !conversation.getSellerId().equals(userId)) {
      throw new BusinessException(HttpStatus.FORBIDDEN, "이 채팅방에 접근할 수 없습니다.");
    }
    return conversation;
  }

  @Transactional(readOnly = true)
  public ConversationDto get(UUID conversationId, UUID userId) {
    TradeConversation conversation = requireParticipant(conversationId, userId);
    String listingTitle = listingRepository.findById(conversation.getListingId())
        .map(TradeListing::getTitle)
        .orElse("");
    return toDto(conversation, listingTitle, userId);
  }

  @Transactional(readOnly = true)
  public List<ConversationSummaryDto> listForUser(UUID userId) {
    List<TradeConversation> conversations =
        conversationRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(userId, userId);
    if (conversations.isEmpty()) {
      return List.of();
    }

    List<UUID> conversationIds = conversations.stream().map(TradeConversation::getId).toList();
    Set<UUID> withMessages = new HashSet<>(
        messageRepository.findDistinctConversationIds(conversationIds));
    conversations = conversations.stream()
        .filter(c -> withMessages.contains(c.getId()))
        .toList();
    if (conversations.isEmpty()) {
      return List.of();
    }

    conversationIds = conversations.stream().map(TradeConversation::getId).toList();
    List<UUID> listingIds = conversations.stream().map(TradeConversation::getListingId).distinct().toList();

    Map<UUID, TradeListing> listingsById = listingRepository.findAllById(listingIds).stream()
        .collect(Collectors.toMap(TradeListing::getId, Function.identity()));

    Map<UUID, String> firstImageByListing = imageRepository
        .findByListingIdInOrderBySortOrderAsc(listingIds).stream()
        .collect(Collectors.toMap(
            TradeListingImage::getListingId,
            TradeListingImage::getPublicUrl,
            (a, b) -> a));

    Map<UUID, String> appointmentStatusByConversation = loadAppointmentStatusByConversation(conversationIds);

    Map<UUID, String> lastPreviewByConversation = messageRepository
        .findLatestByConversationIdIn(conversationIds).stream()
        .collect(Collectors.toMap(
            TradeMessage::getConversationId,
            this::messagePreview,
            (a, b) -> a));

    Set<UUID> peerIds = conversations.stream()
        .map(c -> c.getBuyerId().equals(userId) ? c.getSellerId() : c.getBuyerId())
        .collect(Collectors.toSet());
    Map<UUID, String> peerNamesById = profileService.displayNames(peerIds);

    List<ConversationSummaryDto> result = new ArrayList<>();
    for (TradeConversation c : conversations) {
      TradeListing listing = listingsById.get(c.getListingId());
      String listingTitle = listing != null ? listing.getTitle() : "";
      String neighborhood = listing != null && listing.getNeighborhood() != null
          ? listing.getNeighborhood()
          : "";
      int price = listing != null && !listing.isFree() ? listing.getPrice() : 0;
      boolean isFree = listing == null || listing.isFree();

      boolean isBuyer = c.getBuyerId().equals(userId);
      UUID peerId = isBuyer ? c.getSellerId() : c.getBuyerId();
      String role = isBuyer ? "buyer" : "seller";

      Double listingLat = listing != null ? listing.getLatitude() : null;
      Double listingLng = listing != null ? listing.getLongitude() : null;
      String listingAddr =
          listing != null && listing.getAddress() != null ? listing.getAddress() : "";

      result.add(toSummaryDto(
          c,
          userId,
          listingTitle,
          firstImageByListing.getOrDefault(c.getListingId(), ""),
          price,
          isFree,
          neighborhood,
          listingLat,
          listingLng,
          listingAddr,
          peerId,
          role,
          appointmentStatusByConversation.getOrDefault(c.getId(), "none"),
          lastPreviewByConversation.getOrDefault(c.getId(), ""),
          peerNamesById.getOrDefault(peerId, "이웃")));
    }
    return result;
  }

  @Transactional
  public void markRead(UUID conversationId, UUID userId) {
    TradeConversation conversation = requireParticipant(conversationId, userId);
    Instant now = Instant.now();
    if (conversation.getBuyerId().equals(userId)) {
      conversation.setBuyerLastReadAt(now);
    } else {
      conversation.setSellerLastReadAt(now);
    }
    conversationRepository.save(conversation);
  }

  @Transactional(readOnly = true)
  public List<ConversationSummaryDto> listByListing(UUID listingId, UUID userId) {
    TradeListing listing = listingRepository.findById(listingId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."));

    List<TradeConversation> conversations;
    if (listing.getSellerId().equals(userId)) {
      conversations = conversationRepository.findByListingIdOrderByUpdatedAtDesc(listingId);
    } else {
      conversations = conversationRepository
          .findByListingIdAndBuyerId(listingId, userId)
          .map(List::of)
          .orElse(List.of());
    }

    if (conversations.isEmpty()) {
      return List.of();
    }

    List<UUID> allConversationIds = conversations.stream().map(TradeConversation::getId).toList();
    Set<UUID> withMessages = new HashSet<>(
        messageRepository.findDistinctConversationIds(allConversationIds));
    conversations = conversations.stream()
        .filter(c -> withMessages.contains(c.getId()))
        .toList();

    if (conversations.isEmpty()) {
      return List.of();
    }

    String listingTitle = listing.getTitle();
    String neighborhood = listing.getNeighborhood() != null ? listing.getNeighborhood() : "";
    int price = listing.isFree() ? 0 : listing.getPrice();
    boolean isFree = listing.isFree();
    String firstImage = imageRepository.findByListingIdOrderBySortOrderAsc(listingId).stream()
        .findFirst()
        .map(TradeListingImage::getPublicUrl)
        .orElse("");

    List<UUID> conversationIds = conversations.stream().map(TradeConversation::getId).toList();
    Map<UUID, String> appointmentStatusByConversation =
        loadAppointmentStatusByConversation(conversationIds);
    Map<UUID, String> lastPreviewByConversation = messageRepository
        .findLatestByConversationIdIn(conversationIds).stream()
        .collect(Collectors.toMap(
            TradeMessage::getConversationId,
            this::messagePreview,
            (a, b) -> a));
    Set<UUID> peerIds = conversations.stream()
        .map(c -> c.getBuyerId().equals(userId) ? c.getSellerId() : c.getBuyerId())
        .collect(Collectors.toSet());
    Map<UUID, String> peerNamesById = profileService.displayNames(peerIds);

    List<ConversationSummaryDto> result = new ArrayList<>();
    for (TradeConversation c : conversations) {
      boolean isBuyer = c.getBuyerId().equals(userId);
      UUID peerId = isBuyer ? c.getSellerId() : c.getBuyerId();
      String role = isBuyer ? "buyer" : "seller";

      result.add(toSummaryDto(
          c,
          userId,
          listingTitle,
          firstImage,
          price,
          isFree,
          neighborhood,
          listing.getLatitude(),
          listing.getLongitude(),
          listing.getAddress() != null ? listing.getAddress() : "",
          peerId,
          role,
          appointmentStatusByConversation.getOrDefault(c.getId(), "none"),
          lastPreviewByConversation.getOrDefault(c.getId(), ""),
          peerNamesById.getOrDefault(peerId, "이웃")));
    }
    return result;
  }

  @Transactional(readOnly = true)
  public ListingTradeStatusDto listingTradeStatus(UUID listingId, UUID userId) {
    List<TradeConversation> conversations = conversationRepository
        .findByListingIdAndBuyerIdOrListingIdAndSellerId(listingId, userId, listingId, userId);
    if (conversations.isEmpty()) {
      return new ListingTradeStatusDto(false, "none", null);
    }

    List<UUID> conversationIds = conversations.stream().map(TradeConversation::getId).toList();
    Map<UUID, String> statusByConversation = loadAppointmentStatusByConversation(conversationIds);

    String bestStatus = "none";
    UUID bestConversationId = null;
    for (TradeConversation c : conversations) {
      String status = statusByConversation.getOrDefault(c.getId(), "none");
      if ("confirmed".equals(status)) {
        return new ListingTradeStatusDto(true, "confirmed", c.getId());
      }
      if ("pending".equals(status) && !"pending".equals(bestStatus)) {
        bestStatus = "pending";
        bestConversationId = c.getId();
      }
    }

    return new ListingTradeStatusDto(false, bestStatus, bestConversationId);
  }

  @Transactional(readOnly = true)
  public Map<UUID, String> appointmentStatusByListingIdForUser(UUID userId) {
    List<TradeConversation> conversations =
        conversationRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(userId, userId);
    if (conversations.isEmpty()) {
      return Map.of();
    }

    List<UUID> conversationIds = conversations.stream().map(TradeConversation::getId).toList();
    Map<UUID, String> statusByConversation = loadAppointmentStatusByConversation(conversationIds);

    Map<UUID, String> result = new HashMap<>();
    for (TradeConversation c : conversations) {
      String status = statusByConversation.getOrDefault(c.getId(), "none");
      if ("none".equals(status)) {
        continue;
      }
      UUID listingId = c.getListingId();
      String existing = result.get(listingId);
      if ("confirmed".equals(status)) {
        result.put(listingId, "confirmed");
      } else if ("pending".equals(status) && !"confirmed".equals(existing)) {
        result.put(listingId, "pending");
      }
    }
    return result;
  }

  private Map<UUID, String> loadAppointmentStatusByConversation(List<UUID> conversationIds) {
    if (conversationIds.isEmpty()) {
      return Map.of();
    }
    List<TradeAppointment> appointments = appointmentRepository
        .findByConversationIdInAndStatusInOrderByUpdatedAtDesc(
            conversationIds, ACTIVE_APPOINTMENT_STATUSES);

    Map<UUID, String> result = new HashMap<>();
    for (TradeAppointment apt : appointments) {
      result.putIfAbsent(apt.getConversationId(), apt.getStatus().name());
    }
    return result;
  }

  private ConversationSummaryDto toSummaryDto(
      TradeConversation c,
      UUID userId,
      String listingTitle,
      String listingImageUrl,
      int listingPrice,
      boolean listingFree,
      String neighborhood,
      Double listingLatitude,
      Double listingLongitude,
      String listingAddress,
      UUID peerId,
      String role,
      String appointmentStatus,
      String lastPreview,
      String peerName) {
    return new ConversationSummaryDto(
        c.getId(),
        c.getListingId(),
        listingTitle,
        listingImageUrl,
        listingPrice,
        listingFree,
        neighborhood,
        listingLatitude,
        listingLongitude,
        listingAddress,
        c.getBuyerId(),
        c.getSellerId(),
        role,
        peerName,
        peerId,
        appointmentStatus,
        lastPreview,
        TimeFormatUtil.relative(c.getUpdatedAt()),
        countUnread(c, userId));
  }

  private int countUnread(TradeConversation conversation, UUID userId) {
    Instant lastRead = conversation.getBuyerId().equals(userId)
        ? conversation.getBuyerLastReadAt()
        : conversation.getSellerLastReadAt();
    if (lastRead == null) {
      lastRead = Instant.EPOCH;
    }
    long unread = messageRepository.countByConversationIdAndSenderIdNotAndSystemFalseAndCreatedAtAfter(
        conversation.getId(), userId, lastRead);
    if (unread > 99) {
      return 99;
    }
    return (int) unread;
  }

  private String messagePreview(TradeMessage message) {
    String body = message.getBody() != null ? message.getBody().trim() : "";
    if (body.isEmpty()) {
      return "";
    }
    String singleLine = body.replace('\n', ' ');
    if (singleLine.length() <= 80) {
      return singleLine;
    }
    return singleLine.substring(0, 80) + "…";
  }

  private TradeConversation createConversation(TradeListing listing, UUID buyerId) {
    Instant now = Instant.now();
    TradeConversation conversation = new TradeConversation();
    conversation.setId(UUID.randomUUID());
    conversation.setListingId(listing.getId());
    conversation.setBuyerId(buyerId);
    conversation.setSellerId(listing.getSellerId());
    conversation.setCreatedAt(now);
    conversation.setUpdatedAt(now);
    return conversationRepository.save(conversation);
  }

  private ConversationDto toDto(TradeConversation c, String listingTitle, UUID currentUserId) {
    boolean isBuyer = c.getBuyerId().equals(currentUserId);
    UUID peerId = isBuyer ? c.getSellerId() : c.getBuyerId();
    String peerName = profileService.displayName(peerId);
    return new ConversationDto(
        c.getId(),
        c.getListingId(),
        listingTitle,
        c.getBuyerId(),
        c.getSellerId(),
        peerName,
        peerId);
  }
}
