package app.villager.service;

import app.villager.domain.ListingStatus;
import app.villager.domain.Neighborhood;
import app.villager.domain.Profile;
import app.villager.domain.TradeListing;
import app.villager.domain.TradeListingImage;
import app.villager.dto.CreateListingRequest;
import app.villager.dto.ListingDto;
import app.villager.repository.NeighborhoodRepository;
import app.villager.repository.ProfileRepository;
import app.villager.repository.TradeListingImageRepository;
import app.villager.repository.TradeListingRepository;
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
public class ListingService {

  private static final ListingStatus STATUS_ACTIVE = ListingStatus.active;

  private final TradeListingRepository listingRepository;
  private final TradeListingImageRepository imageRepository;
  private final ProfileRepository profileRepository;
  private final NeighborhoodRepository neighborhoodRepository;
  private final NeighborhoodService neighborhoodService;
  private final XpService xpService;
  private final ConversationService conversationService;

  public ListingService(
      TradeListingRepository listingRepository,
      TradeListingImageRepository imageRepository,
      ProfileRepository profileRepository,
      NeighborhoodRepository neighborhoodRepository,
      NeighborhoodService neighborhoodService,
      XpService xpService,
      ConversationService conversationService) {
    this.listingRepository = listingRepository;
    this.imageRepository = imageRepository;
    this.profileRepository = profileRepository;
    this.neighborhoodRepository = neighborhoodRepository;
    this.neighborhoodService = neighborhoodService;
    this.xpService = xpService;
    this.conversationService = conversationService;
  }

  @Transactional(readOnly = true)
  public List<ListingDto> listActive(UUID userId, List<UUID> neighborhoodIds) {
    List<TradeListing> listings;
    if (neighborhoodIds != null && !neighborhoodIds.isEmpty()) {
      listings = listingRepository.findByStatusAndNeighborhoodIdInOrderByCreatedAtDesc(
          STATUS_ACTIVE, neighborhoodIds);
    } else if (userId != null) {
      List<UUID> registered = neighborhoodService.registeredNeighborhoodIds(userId);
      if (registered.isEmpty()) {
        return List.of();
      }
      listings = listingRepository.findByStatusAndNeighborhoodIdInOrderByCreatedAtDesc(
          STATUS_ACTIVE, registered);
    } else {
      listings = listingRepository.findByStatusOrderByCreatedAtDesc(STATUS_ACTIVE);
    }
    return mapListings(listings, userId);
  }

  @Transactional(readOnly = true)
  public ListingDto getActive(UUID id, UUID userId) {
    TradeListing listing = listingRepository.findByIdAndStatus(id, STATUS_ACTIVE)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."));
    if (userId != null) {
      neighborhoodService.requireVerifiedForListing(userId, listing);
    }
    return mapListings(List.of(listing), userId).get(0);
  }

  @Transactional
  public ListingDto create(UUID sellerId, CreateListingRequest request) {
    profileRepository.findById(sellerId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "판매자 프로필이 없습니다. 다시 로그인해 주세요."));

    if (!request.isFree() && (request.price() == null || request.price() <= 0)) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "가격을 입력하거나 무료 나눔을 선택해 주세요.");
    }
    if (request.imageUrls() == null || request.imageUrls().isEmpty()) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "사진을 1장 이상 등록해 주세요.");
    }

    Neighborhood neighborhood = neighborhoodRepository.findById(request.neighborhoodId())
        .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "동네를 찾을 수 없습니다."));
    neighborhoodService.requireVerifiedForCreate(sellerId, neighborhood.getId());

    Instant now = Instant.now();
    TradeListing listing = new TradeListing();
    listing.setId(UUID.randomUUID());
    listing.setSellerId(sellerId);
    listing.setTitle(request.title().trim());
    listing.setDescription(request.description() != null ? request.description().trim() : "");
    listing.setFree(request.isFree());
    listing.setPrice(request.isFree() ? 0 : request.price());
    listing.setNeighborhoodId(neighborhood.getId());
    listing.setNeighborhood(
        request.neighborhood() != null && !request.neighborhood().isBlank()
            ? request.neighborhood().trim()
            : neighborhood.getName());
    listing.setLatitude(request.latitude());
    listing.setLongitude(request.longitude());
    listing.setAddress(request.address() != null ? request.address().trim() : null);
    listing.setStatus(STATUS_ACTIVE);
    listing.setCreatedAt(now);
    listing.setUpdatedAt(now);
    listingRepository.save(listing);

    int order = 0;
    for (String url : request.imageUrls()) {
      TradeListingImage image = new TradeListingImage();
      image.setId(UUID.randomUUID());
      image.setListingId(listing.getId());
      image.setPublicUrl(url.trim());
      image.setStoragePath("external/" + listing.getId() + "/" + order);
      image.setSortOrder(order++);
      image.setCreatedAt(now);
      imageRepository.save(image);
    }

    xpService.addXp(sellerId, 15);

    return mapListings(List.of(listing), sellerId).get(0);
  }

  private List<ListingDto> mapListings(List<TradeListing> listings, UUID userId) {
    if (listings.isEmpty()) {
      return List.of();
    }

    List<UUID> listingIds = listings.stream().map(TradeListing::getId).toList();
    List<UUID> sellerIds = listings.stream().map(TradeListing::getSellerId).distinct().toList();

    Map<UUID, List<String>> imagesByListing = imageRepository
        .findByListingIdInOrderBySortOrderAsc(listingIds).stream()
        .collect(Collectors.groupingBy(
            TradeListingImage::getListingId,
            Collectors.mapping(TradeListingImage::getPublicUrl, Collectors.toList())));

    Map<UUID, Profile> sellers = profileRepository.findAllById(sellerIds).stream()
        .collect(Collectors.toMap(Profile::getId, Function.identity()));

    Map<UUID, String> appointmentByListing = userId != null
        ? conversationService.appointmentStatusByListingIdForUser(userId)
        : Map.of();

    List<ListingDto> result = new ArrayList<>();
    for (TradeListing listing : listings) {
      Profile seller = sellers.get(listing.getSellerId());
      String sellerName = seller != null
          ? firstNonBlank(seller.getDisplayName(), seller.getNickname(), "이웃")
          : "판매자";
      result.add(new ListingDto(
          listing.getId(),
          listing.getTitle(),
          listing.getDescription(),
          listing.isFree() ? 0 : listing.getPrice(),
          listing.isFree(),
          imagesByListing.getOrDefault(listing.getId(), List.of()),
          listing.getNeighborhoodId(),
          listing.getNeighborhood() != null ? listing.getNeighborhood() : "",
          listing.getLatitude(),
          listing.getLongitude(),
          listing.getAddress() != null ? listing.getAddress() : "",
          listing.getSellerId(),
          sellerName,
          TimeFormatUtil.relative(listing.getCreatedAt()),
          appointmentByListing.getOrDefault(listing.getId(), "none")));
    }
    return result;
  }

  private static String firstNonBlank(String... values) {
    for (String v : values) {
      if (v != null && !v.isBlank()) {
        return v;
      }
    }
    return "이웃";
  }
}
