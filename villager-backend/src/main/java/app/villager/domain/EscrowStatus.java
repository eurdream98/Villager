package app.villager.domain;

public enum EscrowStatus {
  none,
  pending_payment,
  paid_held,
  seller_fulfilled,
  buyer_confirmed,
  disputed,
  released,
  refunded,
  cancelled
}
