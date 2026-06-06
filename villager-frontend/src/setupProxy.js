const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyTarget = process.env.REACT_APP_API_PROXY_TARGET || 'http://127.0.0.1:8080';

/** CRA dev: /api, /ws → Spring Boot (CORS 없이 동일 출처로 호출) */
module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: proxyTarget,
      changeOrigin: true,
    }),
  );
  app.use(
    '/ws',
    createProxyMiddleware({
      target: proxyTarget,
      changeOrigin: true,
      ws: true,
    }),
  );
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: proxyTarget,
      changeOrigin: true,
    }),
  );
};
