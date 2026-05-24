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

Supabase Redirect URLs에 Vercel 도메인 추가 (예: `https://your-app.vercel.app`)
