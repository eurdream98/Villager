package app.villager.service;

import app.villager.domain.MemberGrowth;
import app.villager.repository.MemberGrowthRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class XpService {

  private final MemberGrowthRepository memberGrowthRepository;

  public XpService(MemberGrowthRepository memberGrowthRepository) {
    this.memberGrowthRepository = memberGrowthRepository;
  }

  @Transactional
  public void addXp(UUID userId, int amount) {
    MemberGrowth growth = memberGrowthRepository.findById(userId).orElseGet(() -> {
      MemberGrowth created = new MemberGrowth();
      created.setUserId(userId);
      created.setTotalXp(0);
      created.setUpdatedAt(Instant.now());
      return memberGrowthRepository.save(created);
    });
    growth.setTotalXp(growth.getTotalXp() + amount);
    growth.setUpdatedAt(Instant.now());
    memberGrowthRepository.save(growth);
  }
}
