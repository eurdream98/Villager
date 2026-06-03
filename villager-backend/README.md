# villager-backend

Villager 거래·채팅·약속 API (Spring Boot 3 + Supabase PostgreSQL + JWT)

## 요구 사항

- Java 17+
- Maven 3.9+
- Supabase에 `villager-frontend/supabase/schema.sql` 적용 완료
- 더미 데이터: OAuth 로그인 후 `villager-frontend/supabase/seed.sql` 실행
- Supabase **DB 비밀번호** (Settings → Database → Connection string)

## 설정

1. `src/main/resources/application-local.yml.example` → `application-local.yml` 복사
2. 값 입력:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.YOUR_REF.supabase.co:5432/postgres?sslmode=require
    username: postgres
    password: YOUR_DB_PASSWORD
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://YOUR_REF.supabase.co/auth/v1

villager:
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3001
```

3. 실행 — **프론트 `npm start`와 다른 PowerShell 창**에서:

```powershell
cd villager-backend
.\run-local.ps1
```

같은 터미널에 `HOST`/`PORT`(Create React App `.env`)가 남아 있으면 Tomcat이 `Bad address: listen`으로 실패할 수 있습니다.

**Cursor/VS Code Run 버튼**으로 실행할 때 로그에 `The following 1 profile is active: "local"` 이 보여야 합니다. `default`만 보이면 `application-local.yml` 없이 로컬 Postgres(`postgres`/`postgres`)에 붙어 비밀번호 오류(28P01)가 납니다. Run 구성: `.vscode/launch.json` → **Villager Backend (local)**.

전역 Maven이 있으면:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

- API: http://localhost:8080/api/v1/health
- WebSocket (STOMP): http://localhost:8080/ws

## 인증

프론트에서 Supabase 로그인 후 받은 **access_token**을 헤더에 넣습니다.

```
Authorization: Bearer <supabase_access_token>
```

Spring이 Supabase JWT `issuer-uri`로 검증합니다. 백엔드는 DB에 **postgres** 로 직접 접속하므로 RLS를 우회합니다.

## API 요약

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/listings` | 거래 피드 |
| GET | `/api/v1/listings/{id}` | 상품 상세 |
| POST | `/api/v1/listings` | 판매 등록 (인증) |
| GET | `/api/v1/profiles/me` | 내 프로필 |
| POST | `/api/v1/listings/{id}/conversations` | 채팅방 생성/조회 |
| GET | `/api/v1/conversations/{id}/messages` | 메시지 목록 |
| POST | `/api/v1/conversations/{id}/messages` | 메시지 전송 |
| GET | `/api/v1/conversations/{id}/appointment` | 약속 조회 |
| POST | `/api/v1/conversations/{id}/appointment/propose` | 약속 제안 |
| POST | `/api/v1/conversations/{id}/appointment/confirm` | 약속 확정 |
| DELETE | `/api/v1/conversations/{id}/appointment` | 약속 초기화 |
| GET | `/api/v1/growth/me` | 내 성장 XP |
| GET | `/api/v1/neighborhoods/trees` | 동네 나무 지도 |

## WebSocket (채팅 실시간)

- 연결: `SockJS` → `http://localhost:8080/ws`
- 구독: `/topic/conversations.{conversationId}` → `MessageDto`
- 구독: `/topic/conversations.{conversationId}.appointment` → `AppointmentDto`

## Railway 배포

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → 이 저장소 선택  
2. 서비스 **Settings → Root Directory** = `villager-backend`  
3. **Variables** (Production):

| 변수 | 예시 |
|------|------|
| `DATABASE_URL` | `jdbc:postgresql://db.YOUR_REF.supabase.co:5432/postgres?sslmode=require` |
| `DATABASE_USERNAME` | `postgres` |
| `DATABASE_PASSWORD` | Supabase Database 비밀번호 |
| `SUPABASE_JWT_ISSUER` | `https://YOUR_REF.supabase.co/auth/v1` |
| `CORS_ORIGINS` | `https://your-app.vercel.app,http://localhost:3000` |
| `SPRING_PROFILES_ACTIVE` | 비우거나 `default` (`local` 프로필은 로컬 전용) |

4. **Deploy** 후 공개 URL 확인 → `https://xxx.up.railway.app/api/v1/health` → `{"status":"ok"}`  
5. Vercel **Environment Variables**: `REACT_APP_API_URL=https://xxx.up.railway.app` (끝에 `/` 없음) → 재배포

`railway.toml` 이 빌드·헬스체크를 지정합니다. `PORT` 는 Railway가 자동 주입합니다.

## 프론트 연동

`.env` 예시:

```
REACT_APP_API_URL=http://localhost:8080
```

로그인 후 API 호출 시 `supabase.auth.getSession()` 의 `access_token` 을 Bearer 로 전달합니다.

## 프로젝트 구조

```
src/main/java/app/villager/
  config/       Security, CORS, WebSocket
  domain/       JPA 엔티티 (schema.sql 테이블)
  repository/
  service/      거래·채팅·약속·XP
  web/          REST 컨트롤러
  websocket/    STOMP 브로드캐스트
```
