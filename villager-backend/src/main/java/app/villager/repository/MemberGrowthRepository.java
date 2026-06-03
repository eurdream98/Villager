package app.villager.repository;

import app.villager.domain.MemberGrowth;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberGrowthRepository extends JpaRepository<MemberGrowth, UUID> {}
