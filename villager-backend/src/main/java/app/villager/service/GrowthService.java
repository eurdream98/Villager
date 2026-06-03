package app.villager.service;

import app.villager.domain.MemberGrowth;
import app.villager.domain.Neighborhood;
import app.villager.domain.NeighborhoodTree;
import app.villager.dto.MemberGrowthDto;
import app.villager.dto.NeighborhoodTreeDto;
import app.villager.repository.MemberGrowthRepository;
import app.villager.repository.NeighborhoodRepository;
import app.villager.repository.NeighborhoodTreeRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GrowthService {

  private final MemberGrowthRepository memberGrowthRepository;
  private final NeighborhoodTreeRepository treeRepository;
  private final NeighborhoodRepository neighborhoodRepository;

  public GrowthService(
      MemberGrowthRepository memberGrowthRepository,
      NeighborhoodTreeRepository treeRepository,
      NeighborhoodRepository neighborhoodRepository) {
    this.memberGrowthRepository = memberGrowthRepository;
    this.treeRepository = treeRepository;
    this.neighborhoodRepository = neighborhoodRepository;
  }

  public MemberGrowthDto getMemberGrowth(UUID userId) {
    long totalXp = memberGrowthRepository.findById(userId)
        .map(MemberGrowth::getTotalXp)
        .orElse(0L);
    return toProgress(totalXp);
  }

  public List<NeighborhoodTreeDto> getNeighborhoodTrees() {
    List<NeighborhoodTree> trees = treeRepository.findAllByOrderByTotalXpDesc();
    Map<UUID, Neighborhood> neighborhoods = neighborhoodRepository.findAll().stream()
        .collect(Collectors.toMap(Neighborhood::getId, Function.identity()));

    return trees.stream()
        .map(t -> {
          Neighborhood n = neighborhoods.get(t.getNeighborhoodId());
          String name = n != null ? n.getName() : "동네";
          double mapX = n != null && n.getMapX() != null ? n.getMapX().doubleValue() : 50;
          double mapY = n != null && n.getMapY() != null ? n.getMapY().doubleValue() : 50;
          return new NeighborhoodTreeDto(t.getId(), name, t.getTotalXp(), mapX, mapY, 0);
        })
        .toList();
  }

  public static MemberGrowthDto toProgress(long totalXp) {
    int level = 1;
    long remaining = totalXp;
    while (remaining >= xpRequiredForLevel(level)) {
      remaining -= xpRequiredForLevel(level);
      level++;
    }
    int xpToNext = xpRequiredForLevel(level);
    int percent = xpToNext == 0 ? 0 : (int) Math.min(100, Math.round((remaining * 100.0) / xpToNext));
    return new MemberGrowthDto(totalXp, level, (int) remaining, xpToNext, percent);
  }

  private static int xpRequiredForLevel(int level) {
    return level * 120;
  }
}
