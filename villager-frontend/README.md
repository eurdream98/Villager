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
