# Villager Supabase 스키마

`schema.sql`을 Supabase **SQL Editor**에서 실행합니다.

## 적용 순서

1. `schema.sql` 실행
2. 앱에서 OAuth 로그인 1회 ( `profiles` 자동 생성 )
3. `seed.sql` 실행 (동네·거래 더미, 계정 2개면 채팅·약속 샘플 포함)
4. **Storage** → 버킷 `trade-listings` (public read, 이미지 업로드 시)
5. Spring 백엔드 사용 시: 프론트 `.env`에 `REACT_APP_API_URL=http://localhost:8080`
6. (선택) Supabase Realtime / Socket.IO — 백엔드 API·폴링 사용 시 `REACT_APP_CHAT_WS_URL` 불필요

## 테이블 요약

| 테이블 | 용도 |
|--------|------|
| `profiles` | 회원 (OAuth 트리거로 자동 생성) |
| `neighborhoods` | 동네·나무 지도 |
| `trade_listings` | 판매 글 |
| `trade_listing_images` | 상품 사진 |
| `trade_conversations` | 상품별 1:1 채팅방 |
| `trade_messages` | 채팅 메시지 |
| `trade_appointments` | 약속 (방법·시간·장소) |
| `trade_orders` | 에스크로 (PG 연동 후) |
| `member_growth` / `xp_events` | 성장 기여도 |

피드 조회는 `trade_listings_feed` 뷰를 사용할 수 있습니다.
