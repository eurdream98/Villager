/**
 * CRA가 다른 포트(3001…)로 떠 있을 때 남는 node/webpack 정리
 */
const kill = require('kill-port');

const BASE = Number(process.env.PORT || 3000);
const SPAN = 11;

async function main() {
  await Promise.all(
    Array.from({ length: SPAN }, (_, i) =>
      kill(BASE + i).catch(() => {}),
    ),
  );
  console.log(`포트 ${BASE}–${BASE + SPAN - 1} 정리 완료`);
}

main();
