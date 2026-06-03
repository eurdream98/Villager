# villager-frontend

동네 커뮤니티 앱 **Villager** 웹 프론트엔드 (Create React App)

## 구조

```
villager-frontend/
├── public/
├── src/
├── package.json
└── Dockerfile
```

## 개발

```bash
cd villager-frontend
npm install
npm start
```

http://localhost:3000

## 빌드

```bash
npm run build
```

## Docker

```bash
docker build -t villager-frontend .
docker run -p 8080:80 villager-frontend
```

http://localhost:8080

## Vercel 배포

**방법 A (권장):** Vercel 프로젝트 → Settings → General → **Root Directory** = `villager-frontend`

**방법 B:** Root Directory 비워 두면 저장소 루트의 `vercel.json`이 빌드 경로를 지정합니다.

Environment Variables (필수):

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

Supabase **Authentication → URL Configuration**:

| 항목 | 값 (예시) |
|------|-----------|
| Site URL | `https://villager-mauve.vercel.app` |
| Redirect URLs | `https://villager-mauve.vercel.app/`, `http://localhost:3000/`, `http://localhost:3001/`, `http://127.0.0.1:3000/` |

로컬 `.env`에는 `REACT_APP_AUTH_REDIRECT_URL`을 **넣지 않습니다** (개발 시 자동으로 `http://localhost:포트/` 사용).

Vercel Environment Variables (배포만):

- `REACT_APP_AUTH_REDIRECT_URL` = `https://villager-mauve.vercel.app/`

`bad_oauth_state` 오류는 보통 인앱 브라우저(카카오톡 등)에서 localStorage가 끊기거나 Redirect URL 불일치일 때 납니다.

## 실시간 채팅 (Socket.IO)

거래 상품 상세 → **채팅하기** 에서 WebSocket 기반 채팅을 사용합니다.

```bash
# 터미널 1 — 채팅 서버 (포트 3001)
cd villager-frontend/server
npm install
npm start

# 터미널 2 — 프론트 (.env 에 추가)
# REACT_APP_CHAT_WS_URL=http://127.0.0.1:3001
npm start
```

`REACT_APP_CHAT_WS_URL` 이 없으면 같은 브라우저 내 **BroadcastChannel** 폴백으로 동작합니다(개발·데모용).
