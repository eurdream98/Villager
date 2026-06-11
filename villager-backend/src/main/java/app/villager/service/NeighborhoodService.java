package app.villager.service;

import app.villager.domain.Neighborhood;
import app.villager.domain.NeighborhoodTree;
import app.villager.domain.TradeListing;
import app.villager.domain.UserNeighborhood;
import app.villager.dto.NeighborhoodDto;
import app.villager.dto.RegisterNeighborhoodRequest;
import app.villager.dto.UserNeighborhoodDto;
import app.villager.dto.VerifyNeighborhoodRequest;
import app.villager.repository.NeighborhoodRepository;
import app.villager.repository.NeighborhoodTreeRepository;
import app.villager.repository.UserNeighborhoodRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NeighborhoodService {

  private static final int VERIFY_VALID_DAYS = 30;
  private static final int DEFAULT_VERIFY_RADIUS_M = 2000;

  private final NeighborhoodRepository neighborhoodRepository;
  private final NeighborhoodTreeRepository neighborhoodTreeRepository;
  private final UserNeighborhoodRepository userNeighborhoodRepository;

  public NeighborhoodService(
      NeighborhoodRepository neighborhoodRepository,
      NeighborhoodTreeRepository neighborhoodTreeRepository,
      UserNeighborhoodRepository userNeighborhoodRepository) {
    this.neighborhoodRepository = neighborhoodRepository;
    this.neighborhoodTreeRepository = neighborhoodTreeRepository;
    this.userNeighborhoodRepository = userNeighborhoodRepository;
  }

  @Transactional(readOnly = true)
  public List<UserNeighborhoodDto> listForUser(UUID userId) {
    List<UserNeighborhood> rows = userNeighborhoodRepository.findByUserIdOrderBySlotAsc(userId);
    if (rows.isEmpty()) {
      return List.of();
    }
    Map<UUID, Neighborhood> neighborhoods = neighborhoodRepository
        .findAllById(rows.stream().map(UserNeighborhood::getNeighborhoodId).toList()).stream()
        .collect(Collectors.toMap(Neighborhood::getId, Function.identity()));
    return rows.stream().map(row -> toDto(row, neighborhoods.get(row.getNeighborhoodId()))).toList();
  }

  @Transactional(readOnly = true)
  public List<UUID> registeredNeighborhoodIds(UUID userId) {
    return userNeighborhoodRepository.findByUserIdOrderBySlotAsc(userId).stream()
        .map(UserNeighborhood::getNeighborhoodId)
        .toList();
  }

  @Transactional
  public UserNeighborhoodDto register(UUID userId, RegisterNeighborhoodRequest request) {
    String name = request.name().trim();
    if (name.isEmpty()) {
      throw new BusinessException(HttpStatus.BAD_REQUEST, "동네 이름을 입력해 주세요.");
    }

    Neighborhood neighborhood = findOrCreate(name, request.latitude(), request.longitude());

    UserNeighborhood existingSlot = userNeighborhoodRepository
        .findByUserIdAndSlot(userId, request.slot())
        .orElse(null);
    if (existingSlot != null && !existingSlot.getNeighborhoodId().equals(neighborhood.getId())) {
      userNeighborhoodRepository.delete(existingSlot);
    }

    UserNeighborhood row = userNeighborhoodRepository
        .findByUserIdAndNeighborhoodId(userId, neighborhood.getId())
        .orElseGet(() -> {
          UserNeighborhood created = new UserNeighborhood();
          created.setId(UUID.randomUUID());
          created.setUserId(userId);
          created.setNeighborhoodId(neighborhood.getId());
          created.setSlot(request.slot());
          created.setVerified(false);
          Instant now = Instant.now();
          created.setCreatedAt(now);
          created.setUpdatedAt(now);
          return created;
        });

    row.setSlot(request.slot());
    row.setUpdatedAt(Instant.now());
    userNeighborhoodRepository.save(row);

    return toDto(row, neighborhood);
  }

  @Transactional
  public UserNeighborhoodDto verify(UUID userId, UUID userNeighborhoodId, VerifyNeighborhoodRequest request) {
    UserNeighborhood row = userNeighborhoodRepository.findByIdAndUserId(userNeighborhoodId, userId)
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "등록된 동네를 찾을 수 없습니다."));

    Neighborhood neighborhood = neighborhoodRepository.findById(row.getNeighborhoodId())
        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "동네 정보를 찾을 수 없습니다."));

    if (!isWithinNeighborhood(neighborhood, request)) {
      throw new BusinessException(
          HttpStatus.BAD_REQUEST,
          "현재 위치가 「" + neighborhood.getName() + "」 동네로 확인되지 않았습니다. 해당 동네 근처에서 다시 시도해 주세요.");
    }

    Instant now = Instant.now();
    row.setVerified(true);
    row.setVerifiedAt(now);
    row.setVerifiedExpiresAt(now.plus(VERIFY_VALID_DAYS, ChronoUnit.DAYS));
    row.setVerifiedLat(request.latitude());
    row.setVerifiedLng(request.longitude());
    row.setUpdatedAt(now);
    userNeighborhoodRepository.save(row);

    return toDto(row, neighborhood);
  }

  @Transactional(readOnly = true)
  public void requireVerifiedForListing(UUID userId, TradeListing listing) {
    if (listing.getSellerId().equals(userId)) {
      return;
    }
    UUID neighborhoodId = listing.getNeighborhoodId();
    if (neighborhoodId == null) {
      return;
    }
    requireVerified(userId, neighborhoodId);
  }

  @Transactional(readOnly = true)
  public void requireVerifiedForCreate(UUID userId, UUID neighborhoodId) {
    requireVerified(userId, neighborhoodId);
  }

  @Transactional(readOnly = true)
  public UserNeighborhood requireVerified(UUID userId, UUID neighborhoodId) {
    UserNeighborhood row = userNeighborhoodRepository
        .findByUserIdAndNeighborhoodId(userId, neighborhoodId)
        .orElseThrow(() -> new BusinessException(
            HttpStatus.FORBIDDEN, "이 동네를 내 동네로 등록한 뒤 인증해 주세요."));

    if (!isCurrentlyVerified(row)) {
      throw new BusinessException(
          HttpStatus.FORBIDDEN, "「" + neighborhoodName(neighborhoodId) + "」 동네 인증이 필요합니다.");
    }
    return row;
  }

  @Transactional(readOnly = true)
  public boolean isCurrentlyVerified(UUID userId, UUID neighborhoodId) {
    return userNeighborhoodRepository.findByUserIdAndNeighborhoodId(userId, neighborhoodId)
        .map(this::isCurrentlyVerified)
        .orElse(false);
  }

  private boolean isCurrentlyVerified(UserNeighborhood row) {
    if (!Boolean.TRUE.equals(row.getVerified())) {
      return false;
    }
    Instant expires = row.getVerifiedExpiresAt();
    return expires == null || expires.isAfter(Instant.now());
  }

  private boolean isWithinNeighborhood(Neighborhood neighborhood, VerifyNeighborhoodRequest request) {
    String detected = request.detectedNeighborhoodName();
    if (detected != null && detected.trim().equals(neighborhood.getName())) {
      return true;
    }

    Double centerLat = neighborhood.getCenterLat();
    Double centerLng = neighborhood.getCenterLng();
    if (centerLat == null || centerLng == null) {
      return detected != null && detected.trim().equals(neighborhood.getName());
    }

    int radius = neighborhood.getVerifyRadiusM() != null
        ? neighborhood.getVerifyRadiusM()
        : DEFAULT_VERIFY_RADIUS_M;
    double distance = distanceMeters(
        centerLat, centerLng, request.latitude(), request.longitude());
    return distance <= radius;
  }

  private Neighborhood findOrCreate(String name, Double lat, Double lng) {
    return neighborhoodRepository.findByName(name)
        .map(existing -> updateCoordsIfMissing(existing, lat, lng))
        .orElseGet(() -> createNeighborhood(name, lat, lng));
  }

  private Neighborhood updateCoordsIfMissing(Neighborhood neighborhood, Double lat, Double lng) {
    if (lat != null && lng != null && neighborhood.getCenterLat() == null) {
      neighborhood.setCenterLat(lat);
      neighborhood.setCenterLng(lng);
      if (neighborhood.getVerifyRadiusM() == null) {
        neighborhood.setVerifyRadiusM(DEFAULT_VERIFY_RADIUS_M);
      }
      return neighborhoodRepository.save(neighborhood);
    }
    return neighborhood;
  }

  private Neighborhood createNeighborhood(String name, Double lat, Double lng) {
    Instant now = Instant.now();
    Neighborhood neighborhood = new Neighborhood();
    neighborhood.setId(UUID.randomUUID());
    neighborhood.setName(name);
    neighborhood.setSlug(generateUniqueSlug(name));
    neighborhood.setCenterLat(lat);
    neighborhood.setCenterLng(lng);
    neighborhood.setVerifyRadiusM(DEFAULT_VERIFY_RADIUS_M);
    neighborhood.setCreatedAt(now);
    neighborhoodRepository.save(neighborhood);

    NeighborhoodTree tree = new NeighborhoodTree();
    tree.setId(UUID.randomUUID());
    tree.setNeighborhoodId(neighborhood.getId());
    tree.setTotalXp(0L);
    tree.setUpdatedAt(now);
    neighborhoodTreeRepository.save(tree);

    return neighborhood;
  }

  private String generateUniqueSlug(String name) {
    String base = name.trim().toLowerCase(Locale.ROOT)
        .replaceAll("\\s+", "-")
        .replaceAll("[^a-z0-9\\-가-힣]", "");
    if (base.isEmpty()) {
      base = "hood";
    }
    String slug = base;
    int suffix = 0;
    while (neighborhoodRepository.existsBySlug(slug)) {
      slug = base + "-" + (++suffix);
    }
    return slug;
  }

  private String neighborhoodName(UUID neighborhoodId) {
    return neighborhoodRepository.findById(neighborhoodId)
        .map(Neighborhood::getName)
        .orElse("동네");
  }

  private UserNeighborhoodDto toDto(UserNeighborhood row, Neighborhood neighborhood) {
    String name = neighborhood != null ? neighborhood.getName() : "동네";
    return new UserNeighborhoodDto(
        row.getId(),
        row.getNeighborhoodId(),
        name,
        row.getSlot(),
        isCurrentlyVerified(row),
        row.getVerifiedAt(),
        row.getVerifiedExpiresAt());
  }

  public static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
    double earthRadius = 6371000.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  public NeighborhoodDto toNeighborhoodDto(Neighborhood neighborhood) {
    return new NeighborhoodDto(
        neighborhood.getId(),
        neighborhood.getName(),
        neighborhood.getSlug(),
        neighborhood.getCenterLat(),
        neighborhood.getCenterLng(),
        neighborhood.getVerifyRadiusM());
  }
}
