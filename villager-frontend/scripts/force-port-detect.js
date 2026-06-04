/**
 * CRA choosePort가 다른 포트를 제안하지 않도록 detect-port-alt를 고정합니다.
 * 실제로 3000이 점유 중이면 이후 webpack listen 단계에서 EADDRINUSE로 실패합니다.
 */
const path = require('path');

const target = require.resolve('detect-port-alt', {
  paths: [path.join(__dirname, '..', 'node_modules', 'react-dev-utils')],
});
const forced = Number(process.env.PORT || 3000);
const original = require(target);

function wrap(port, host, callback) {
  const want = parseInt(port, 10) || 0;
  if (want === forced) {
    if (typeof host === 'function') {
      host(null, forced);
      return;
    }
    if (typeof callback === 'function') {
      callback(null, forced);
      return;
    }
    return Promise.resolve(forced);
  }
  return original(port, host, callback);
}

require.cache[target].exports = wrap;
