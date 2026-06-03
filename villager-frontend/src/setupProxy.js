const { createProxyMiddleware } = require('http-proxy-middleware');

/** CRA dev: /api → Spring Boot (CORS 없이 동일 출처로 호출) */
module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_PROXY_TARGET || 'http://127.0.0.1:8080',
      changeOrigin: true,
    }),
  );
};
