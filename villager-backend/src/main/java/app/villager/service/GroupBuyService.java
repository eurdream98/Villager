package app.villager.service;

import app.villager.config.GroupBuyProperties;
import app.villager.domain.GroupBuyCampaign;
import app.villager.domain.GroupBuyCampaignImage;
import app.villager.domain.GroupBuyParticipant;
import app.villager.domain.GroupBuyParticipantTier;
import app.villager.domain.GroupBuyStatus;
import app.villager.domain.Profile;
import app.villager.dto.CommitGroupBuyRequest;
import app.villager.dto.CreateGroupBuyRequest;
import app.villager.dto.GroupBuyDto;
import app.villager.dto.SimulateGroupBuyRequest;
import app.villager.repository.GroupBuyCampaignImageRepository;
import app.villager.repository.GroupBuyCampaignRepository;
import app.villager.repository.GroupBuyParticipantRepository;
import app.villager.repository.ProfileRepository;
import app.villager.util.TimeFormatUtil;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroupBuyService {

  private static final List<GroupBuyStatus> FEED_STATUSES =
      List.of(
          GroupBuyStatus.recruiting,
          GroupBuyStatus.succeeded,
          GroupBuyStatus.pickup,
          GroupBuyStatus.completed);

  private final GroupBuyCampaignRepository campaignRepository;
  private final GroupBuyCampaignImageRepository imageRepository;
  private final GroupBuyParticipantRepository participantRepository;
  private final ProfileRepository profileRepository;
  private final GroupBuyProperties groupBuyProperties;

  public GroupBuyService(
      GroupBuyCampaignRepository campaignRepository,
      GroupBuyCampaignImageRepository imageRepository,
      GroupBuyParticipantRepository participantRepository,
      ProfileRepository profileRepository,
      GroupBuyProperties groupBuyProperties) {
    this.campaignRepository = campaignRepository;
    this.imageRepository = imageRepository;
    this.participantRepository = participantRepository;
    this.profileRepository = profileRepository;
    this.groupBuyProperties = groupBuyProperties;
  }

  @Transactional(readOnly = true)
  public List<GroupBuyDto> listFeed(UUID userId) {
    List<GroupBuyCampaign> campaigns =
        campaignRepository.findByStatusInOrderByCreatedAtDesc(FEED_STATUSES);
    return mapCampaigns(campaigns, userId);
  }

  @Transactional(readOnly = true)
  public GroupBuyDto get(UUID id, UUID userId) {
    GroupBuyCampaign campaign =
        campaignRepository
            .findById(id)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "공동구매를 찾을 수 없습니다."));
    return mapCampaigns(List.of(campaign), userId).get(0);
  }

  @Transactional
  public GroupBuyDto create(UUID organizerId, CreateGroupBuyRequest request) {
    profileRepository
        .findById(organizerId)
        .orElseThrow(
            () -> new BusinessException(HttpStatus.NOT_FOUND, "프로필이 없습니다. 다시 로그인해 주세요."));

    if (request.imageUrls() == null || request.imageUrls().isEmpty()) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "사진을 1장 이상 등록해 주세요.");
    }

    Instant deadline = parseInstant(request.deadlineAt(), "모집 마감");
    Instant pickupStart = parseInstant(request.pickupStartAt(), "픽업 시작");
    Instant pickupEnd = parseInstant(request.pickupEndAt(), "픽업 종료");

    if (!pickupEnd.isAfter(pickupStart)) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "픽업 종료는 시작보다 늦어야 합니다.");
    }
    if (deadline.isBefore(Instant.now())) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "모집 마감은 현재 이후여야 합니다.");
    }
    if (request.maxCommitted() != null && request.maxCommitted() < request.minCommitted()) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "최대 인원은 최소 인원 이상이어야 합니다.");
    }

    Instant now = Instant.now();
    GroupBuyCampaign campaign = new GroupBuyCampaign();
    campaign.setId(UUID.randomUUID());
    campaign.setOrganizerId(organizerId);
    campaign.setTitle(request.title().trim());
    campaign.setDescription(request.description() != null ? request.description().trim() : "");
    campaign.setPricePerUnit(request.pricePerUnit());
    campaign.setExternalUrl(trimUrl(request.externalUrl()));
    campaign.setMinCommitted(request.minCommitted());
    campaign.setMaxCommitted(request.maxCommitted());
    campaign.setDeadlineAt(deadline);
    campaign.setPickupLocation(request.pickupLocation().trim());
    campaign.setPickupStartAt(pickupStart);
    campaign.setPickupEndAt(pickupEnd);
    campaign.setPickupNotes(request.pickupNotes() != null ? request.pickupNotes().trim() : "");
    campaign.setNeighborhood(request.neighborhood());
    campaign.setStatus(GroupBuyStatus.recruiting);
    campaign.setDevSimulatedInterested(0);
    campaign.setDevSimulatedCommitted(0);
    campaign.setCreatedAt(now);
    campaign.setUpdatedAt(now);
    campaignRepository.save(campaign);

    int order = 0;
    for (String url : request.imageUrls()) {
      GroupBuyCampaignImage image = new GroupBuyCampaignImage();
      image.setId(UUID.randomUUID());
      image.setCampaignId(campaign.getId());
      image.setPublicUrl(url.trim());
      image.setSortOrder(order++);
      image.setCreatedAt(now);
      imageRepository.save(image);
    }

    return get(campaign.getId(), organizerId);
  }

  @Transactional
  public GroupBuyDto expressInterest(UUID campaignId, UUID userId) {
    GroupBuyCampaign campaign = requireRecruiting(campaignId);
    rejectOrganizer(campaign, userId, "등록자는 관심 표시 대신 확정 참여를 사용할 수 없습니다.");

    GroupBuyParticipant participant = findOrCreateParticipant(campaignId, userId);
    if (participant.getTier() == GroupBuyParticipantTier.committed) {
      throw new BusinessException(HttpStatus.CONFLICT, "이미 확정 참여 중입니다.");
    }
    participant.setTier(GroupBuyParticipantTier.interested);
    participant.setUpdatedAt(Instant.now());
    participantRepository.save(participant);
    return get(campaignId, userId);
  }

  @Transactional
  public GroupBuyDto commit(UUID campaignId, UUID userId, CommitGroupBuyRequest request) {
    GroupBuyCampaign campaign = requireRecruiting(campaignId);
    rejectOrganizer(campaign, userId, "등록자는 확정 참여할 수 없습니다.");
    int quantity = request.quantity();

    int committedCount = countCommittedParticipants(campaign);
    if (campaign.getMaxCommitted() != null && committedCount >= campaign.getMaxCommitted()) {
      throw new BusinessException(HttpStatus.CONFLICT, "확정 참여 정원이 가득 찼습니다.");
    }

    GroupBuyParticipant participant = findOrCreateParticipant(campaignId, userId);
    boolean alreadyCommitted = participant.getTier() == GroupBuyParticipantTier.committed;

    if (!alreadyCommitted && !groupBuyProperties.isMockPaymentEnabled()) {
      throw new BusinessException(
          HttpStatus.NOT_IMPLEMENTED, "실결제 연동 전입니다. mock-payment-enabled 를 켜 주세요.");
    }

    participant.setTier(GroupBuyParticipantTier.committed);
    participant.setQuantity(quantity);
    if (!alreadyCommitted) {
      participant.setPaymentRef("mock-gb-" + UUID.randomUUID());
    }
    participant.setUpdatedAt(Instant.now());
    participantRepository.save(participant);

    campaign.setUpdatedAt(Instant.now());
    campaignRepository.save(campaign);

    trySucceed(campaign);
    return get(campaignId, userId);
  }

  @Transactional
  public GroupBuyDto cancelParticipation(UUID campaignId, UUID userId) {
    GroupBuyCampaign campaign = requireRecruiting(campaignId);
    if (campaign.getOrganizerId().equals(userId)) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "등록자는 참여를 취소할 수 없습니다. 공동구매를 삭제해 주세요.");
    }

    participantRepository
        .findByCampaignIdAndUserId(campaignId, userId)
        .ifPresent(participantRepository::delete);

    campaign.setUpdatedAt(Instant.now());
    campaignRepository.save(campaign);
    return get(campaignId, userId);
  }

  @Transactional
  public GroupBuyDto confirmPickup(UUID campaignId, UUID userId) {
    GroupBuyCampaign campaign = requirePickupPhase(campaignId);
    GroupBuyParticipant participant =
        participantRepository
            .findByCampaignIdAndUserId(campaignId, userId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "참여 내역이 없습니다."));

    if (participant.getTier() != GroupBuyParticipantTier.committed) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "확정 참여자만 수령 확인할 수 있습니다.");
    }
    if (participant.getPickedUpAt() != null) {
      throw new BusinessException(HttpStatus.CONFLICT, "이미 수령 확인했습니다.");
    }

    Instant now = Instant.now();
    participant.setPickedUpAt(now);
    participant.setUpdatedAt(now);
    participantRepository.save(participant);

    tryComplete(campaign);
    return get(campaignId, userId);
  }

  @Transactional
  public GroupBuyDto completeDistribution(UUID campaignId, UUID userId) {
    GroupBuyCampaign campaign = requirePickupPhase(campaignId);
    if (!campaign.getOrganizerId().equals(userId)) {
      throw new BusinessException(HttpStatus.FORBIDDEN, "등록자만 배분 완료를 할 수 있습니다.");
    }

    Instant now = Instant.now();
    campaign.setStatus(GroupBuyStatus.completed);
    campaign.setUpdatedAt(now);
    campaignRepository.save(campaign);
    return get(campaignId, userId);
  }

  @Transactional
  public GroupBuyDto simulate(UUID campaignId, UUID userId, SimulateGroupBuyRequest request) {
    if (!groupBuyProperties.isDevSimulateEnabled()) {
      throw new BusinessException(HttpStatus.FORBIDDEN, "테스트 시뮬레이션 API가 꺼져 있습니다.");
    }

    GroupBuyCampaign campaign = requireRecruiting(campaignId);
    campaign.setDevSimulatedInterested(
        campaign.getDevSimulatedInterested() + request.interested());
    campaign.setDevSimulatedCommitted(
        campaign.getDevSimulatedCommitted() + request.committed());
    campaign.setUpdatedAt(Instant.now());
    campaignRepository.save(campaign);

    trySucceed(campaign);
    return get(campaignId, userId);
  }

  @Transactional
  public void processDeadlines() {
    List<GroupBuyCampaign> expired =
        campaignRepository.findByStatusAndDeadlineAtBefore(
            GroupBuyStatus.recruiting, Instant.now());

    for (GroupBuyCampaign campaign : expired) {
      int committed = countCommittedParticipants(campaign);
      if (committed >= campaign.getMinCommitted()) {
        markSucceeded(campaign);
      } else {
        campaign.setStatus(GroupBuyStatus.failed);
        campaign.setUpdatedAt(Instant.now());
        campaignRepository.save(campaign);
      }
    }
  }

  private void trySucceed(GroupBuyCampaign campaign) {
    if (campaign.getStatus() != GroupBuyStatus.recruiting) {
      return;
    }
    if (countCommittedParticipants(campaign) >= campaign.getMinCommitted()) {
      markSucceeded(campaign);
    }
  }

  private void markSucceeded(GroupBuyCampaign campaign) {
    Instant now = Instant.now();
    campaign.setStatus(GroupBuyStatus.pickup);
    campaign.setSucceededAt(now);
    campaign.setUpdatedAt(now);
    campaignRepository.save(campaign);
  }

  private void tryComplete(GroupBuyCampaign campaign) {
    if (campaign.getStatus() != GroupBuyStatus.pickup) {
      return;
    }
    long committed =
        participantRepository.countByCampaignIdAndTier(
            campaign.getId(), GroupBuyParticipantTier.committed);
    long pickedUp =
        participantRepository.countByCampaignIdAndTierAndPickedUpAtIsNotNull(
            campaign.getId(), GroupBuyParticipantTier.committed);
    if (committed > 0 && pickedUp >= committed) {
      campaign.setStatus(GroupBuyStatus.completed);
      campaign.setUpdatedAt(Instant.now());
      campaignRepository.save(campaign);
    }
  }

  private GroupBuyCampaign requireRecruiting(UUID campaignId) {
    GroupBuyCampaign campaign =
        campaignRepository
            .findById(campaignId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "공동구매를 찾을 수 없습니다."));
    if (campaign.getStatus() != GroupBuyStatus.recruiting) {
      throw new BusinessException(HttpStatus.CONFLICT, "모집이 종료된 공동구매입니다.");
    }
    return campaign;
  }

  private GroupBuyCampaign requirePickupPhase(UUID campaignId) {
    GroupBuyCampaign campaign =
        campaignRepository
            .findById(campaignId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "공동구매를 찾을 수 없습니다."));
    if (campaign.getStatus() != GroupBuyStatus.pickup
        && campaign.getStatus() != GroupBuyStatus.succeeded) {
      throw new BusinessException(HttpStatus.CONFLICT, "픽업 단계가 아닙니다.");
    }
    if (campaign.getStatus() == GroupBuyStatus.succeeded) {
      campaign.setStatus(GroupBuyStatus.pickup);
      campaign.setUpdatedAt(Instant.now());
      campaignRepository.save(campaign);
    }
    return campaign;
  }

  private void rejectOrganizer(GroupBuyCampaign campaign, UUID userId, String message) {
    if (campaign.getOrganizerId().equals(userId)) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, message);
    }
  }

  private GroupBuyParticipant findOrCreateParticipant(UUID campaignId, UUID userId) {
    return participantRepository
        .findByCampaignIdAndUserId(campaignId, userId)
        .orElseGet(
            () -> {
              Instant now = Instant.now();
              GroupBuyParticipant p = new GroupBuyParticipant();
              p.setId(UUID.randomUUID());
              p.setCampaignId(campaignId);
              p.setUserId(userId);
              p.setTier(GroupBuyParticipantTier.interested);
              p.setQuantity(1);
              p.setCreatedAt(now);
              p.setUpdatedAt(now);
              return p;
            });
  }

  private int countCommittedParticipants(GroupBuyCampaign campaign) {
    long real =
        participantRepository.countByCampaignIdAndTier(
            campaign.getId(), GroupBuyParticipantTier.committed);
    return (int) real + campaign.getDevSimulatedCommitted();
  }

  private int countInterestedParticipants(GroupBuyCampaign campaign) {
    long real =
        participantRepository.countByCampaignIdAndTier(
            campaign.getId(), GroupBuyParticipantTier.interested);
    return (int) real + campaign.getDevSimulatedInterested();
  }

  private List<GroupBuyDto> mapCampaigns(List<GroupBuyCampaign> campaigns, UUID userId) {
    if (campaigns.isEmpty()) {
      return List.of();
    }

    List<UUID> campaignIds = campaigns.stream().map(GroupBuyCampaign::getId).toList();
    Map<UUID, List<String>> imagesByCampaign = loadImages(campaignIds);

    List<UUID> organizerIds =
        campaigns.stream().map(GroupBuyCampaign::getOrganizerId).distinct().toList();
    Map<UUID, Profile> profiles =
        profileRepository.findAllById(organizerIds).stream()
            .collect(Collectors.toMap(Profile::getId, Function.identity()));

    Map<UUID, GroupBuyParticipant> myParticipation = Map.of();
    if (userId != null) {
      myParticipation =
          participantRepository.findByCampaignIdInAndUserId(campaignIds, userId).stream()
              .collect(Collectors.toMap(GroupBuyParticipant::getCampaignId, Function.identity()));
    }

    List<GroupBuyDto> result = new ArrayList<>();
    for (GroupBuyCampaign campaign : campaigns) {
      int interested = countInterestedParticipants(campaign);
      int committed = countCommittedParticipants(campaign);
      long committedQty =
          participantRepository.sumQuantityByCampaignIdAndTier(
              campaign.getId(), GroupBuyParticipantTier.committed);
      long pickedUp =
          participantRepository.countByCampaignIdAndTierAndPickedUpAtIsNotNull(
              campaign.getId(), GroupBuyParticipantTier.committed);

      Profile organizer = profiles.get(campaign.getOrganizerId());
      String organizerName = displayName(organizer);
      GroupBuyParticipant mine = myParticipation.get(campaign.getId());

      result.add(
          new GroupBuyDto(
              campaign.getId(),
              campaign.getTitle(),
              campaign.getDescription(),
              campaign.getPricePerUnit(),
              campaign.getExternalUrl(),
              campaign.getMinCommitted(),
              campaign.getMaxCommitted(),
              TimeFormatUtil.iso(campaign.getDeadlineAt()),
              campaign.getPickupLocation(),
              TimeFormatUtil.iso(campaign.getPickupStartAt()),
              TimeFormatUtil.iso(campaign.getPickupEndAt()),
              campaign.getPickupNotes(),
              campaign.getNeighborhood(),
              campaign.getStatus().name(),
              interested,
              committed,
              (int) committedQty + campaign.getDevSimulatedCommitted(),
              (int) pickedUp,
              campaign.getDevSimulatedInterested() > 0
                  || campaign.getDevSimulatedCommitted() > 0,
              campaign.getOrganizerId(),
              organizerName,
              imagesByCampaign.getOrDefault(campaign.getId(), List.of()),
              mine != null ? mine.getTier().name() : null,
              mine != null ? mine.getQuantity() : null,
              mine != null && mine.getPickedUpAt() != null,
              TimeFormatUtil.iso(campaign.getCreatedAt()),
              TimeFormatUtil.iso(campaign.getSucceededAt())));
    }
    return result;
  }

  private Map<UUID, List<String>> loadImages(List<UUID> campaignIds) {
    Map<UUID, List<String>> map = new java.util.HashMap<>();
    for (UUID id : campaignIds) {
      List<String> urls =
          imageRepository.findByCampaignIdOrderBySortOrderAsc(id).stream()
              .map(GroupBuyCampaignImage::getPublicUrl)
              .toList();
      map.put(id, urls);
    }
    return map;
  }

  private static String displayName(Profile profile) {
    if (profile == null) {
      return "이웃";
    }
    if (profile.getNickname() != null && !profile.getNickname().isBlank()) {
      return profile.getNickname();
    }
    if (profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
      return profile.getDisplayName();
    }
    return "이웃";
  }

  private static Instant parseInstant(String raw, String label) {
    if (raw == null || raw.isBlank()) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, label + " 시각을 입력해 주세요.");
    }
    try {
      return Instant.parse(raw);
    } catch (Exception ex) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, label + " 시각 형식이 올바르지 않습니다.");
    }
  }

  private static String trimUrl(String url) {
    if (url == null || url.isBlank()) {
      return null;
    }
    return url.trim();
  }
}
