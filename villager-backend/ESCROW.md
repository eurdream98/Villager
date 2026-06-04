# Villager 에스크로 결제

택배·문고리 거래에 대한 에스크로(결제 보관 → 이행 → 검수 → 정산) 기능입니다.  
**만나서 거래는 현장 결제**만 지원하며 에스크로를 사용하지 않습니다.

## DB 마이그레이션 (기존 Supabase)

`schema.sql`을 이미 적용한 DB라면 **1회** 실행:

```
villager-frontend/supabase/escrow-migration.sql
```

## 흐름 요약

| 단계 | 상태 | 행위 |
|------|------|------|
| 1 | `pending_payment` | 약속 확정(택배/문고리) → 구매자 **24시간 이내** 결제 |
| 2 | `paid_held` | 결제 금액 플랫폼 보관 → 판매자 발송/배치 |
| 3 | `seller_fulfilled` | 구매자 **수령 확인** (미확인 시 **7일 후 자동 수령 확정**) |
| 4 | `buyer_confirmed` | 검수 타이머 시작 (택배 7일 / 문고리 48시간) |
| 5a | → `released` | 구매자 「거래 완료」 또는 기한 만료 **자동 정산** |
| 5b | → `disputed` | 「문제 신고」 → 합의안 제안·수락 → 정산/환불 |

## API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/conversations/{id}/order` | 주문 조회 |
| POST | `.../order/pay` | 결제 (구매자, mock) |
| POST | `.../order/fulfill` | 발송/배치 완료 (판매자) |
| POST | `.../order/confirm-receipt` | 수령 확인 (구매자) |
| POST | `.../order/complete` | 거래 완료 (구매자) |
| POST | `.../order/dispute` | 문제 신고 (구매자) |
| POST | `.../order/propose-settlement` | 합의안 제안 |
| POST | `.../order/accept-settlement` | 합의 수락 |

WebSocket: `/topic/conversations.{id}.order` → `TradeOrderDto`

## 설정 (`application.yml`)

```yaml
villager:
  escrow:
    payment-deadline-hours: 24
    inspection-deadline-hours-shipping: 168   # 7일
    inspection-deadline-hours-door: 48
    auto-receipt-confirm-hours: 168         # 판매자 이행 후 자동 수령 확정
    mock-payment-enabled: true                # PG 연동 전
    scheduler-interval-ms: 60000
```

## 실제 PG 연동 (권장 플랫폼)

한국 C2C·마켓플레이스에 많이 쓰는 선택지:

| PG | 특징 | Villager 연동 포인트 |
|----|------|----------------------|
| **[토스페이먼츠](https://www.tosspayments.com/)** | 에스크로·분할정산 API, 국내 중고앱 다수 | `POST /order/pay` → 결제창 → webhook → `paid_held` |
| **[PortOne (구 아임포트)](https://portone.io/)** | 여러 PG 통합, 정산·환불 SDK | 동일 |
| **Stripe Connect** | 해외·글로벌, Escrow via Connect | `PaymentIntent` + `transfer` |

### 연동 시 필요한 것

1. **사업자 등록** · PG 가맹 (에스크로/지급대행)
2. **환경 변수**: `TOSS_SECRET_KEY`, webhook secret 등 (Railway Variables)
3. **Webhook URL**: `POST /api/v1/webhooks/payments/toss` (서명 검증 필수)
4. **정산 계좌**: 판매자 본인인증·계좌 등록 (Connect/서브몰)
5. **`mock-payment-enabled: false`** 로 전환

### 코드에서 바꿀 위치

- `EscrowService.pay()` — PG 결제 세션 생성
- 새 `PaymentWebhookController` — `paid_held` / 환불 확인
- `releaseToSeller()` / `refundOrder()` — PG 지급·환불 API 호출

## 기술 스택 (현재)

- **상태 저장**: Supabase PostgreSQL `trade_orders`
- **상태 전이**: Spring `EscrowService` (트랜잭션)
- **자동 기한**: Spring `@Scheduled` `EscrowScheduler`
- **UI**: React `TradeEscrowPanel` (채팅 폴링 2.5s)
- **알림**: 채팅 시스템 메시지 + (선택) STOMP `/order` 토픽

## 코드 흐름

```
약속 확정 (AppointmentService.confirm)
  └─ EscrowService.onAppointmentConfirmed
       ├─ meet / free → 시스템 메시지만
       └─ shipping / door → trade_orders INSERT (pending_payment)
            └─ payment_deadline_at = now + 24h

구매자 결제 (OrderController.pay → EscrowService.pay)
  └─ mock payment_ref → paid_held

판매자 이행 (fulfill) → seller_fulfilled
  └─ receipt_confirm_deadline_at = now + 7d

구매자 수령 확인 (confirmReceipt) → buyer_confirmed
  └─ EscrowScheduler: seller_fulfilled 기한 만료 → 자동 buyer_confirmed
  └─ inspection_deadline_at = now + 7d/48h

검수 기간
  ├─ complete → released (판매자 정산)
  ├─ dispute → disputed (타이머 중단)
  │    └─ propose-settlement → accept-settlement → released/refunded
  └─ EscrowScheduler (기한 만료) → released (자동 정산)

약속 재설정 (reset)
  └─ onAppointmentReset → paid면 refunded, else cancelled
```
