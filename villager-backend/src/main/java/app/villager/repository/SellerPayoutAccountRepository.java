package app.villager.repository;

import app.villager.domain.PayoutAccountStatus;
import app.villager.domain.SellerPayoutAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerPayoutAccountRepository extends JpaRepository<SellerPayoutAccount, UUID> {

  Optional<SellerPayoutAccount> findByUserIdAndStatus(UUID userId, PayoutAccountStatus status);
}
