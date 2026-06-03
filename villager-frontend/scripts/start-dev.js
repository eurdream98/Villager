/**
 * CRA는 3000이 점유되면 터미널에서 "다른 포트 쓸까요?" 를 묻습니다.
 * 포트를 비운 뒤 3000이 실제로 비었는지 확인하고, 아니면 종료합니다(프롬프트 없음).
 */
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const kill = require('kill-port');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || 'localhost';

function portFree(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ port, host, ipv6Only: false }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function ensurePortFree(port, host, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await kill(port);
    } catch {
      /* already free */
    }
    await new Promise((r) => setTimeout(r, 900));
    if (await portFree(port, host)) {
      console.log(`Port ${port} (${host}) 사용 가능`);
      return;
    }
    console.log(`Port ${port} 아직 사용 중… (${attempt}/${maxAttempts})`);
  }
  console.error(
    `\n포트 ${port}을(를) 비우지 못했습니다.\n` +
      '  npm run stop:dev\n' +
      '  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force\n',
  );
  process.exit(1);
}

function runReactScripts() {
  const bin = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'react-scripts.cmd' : 'react-scripts',
  );

  const env = {
    ...process.env,
    PORT: String(PORT),
    HOST,
    CI: 'false',
  };

  const child = spawn(bin, ['start'], { stdio: 'inherit', env, shell: true });
  child.on('exit', (code) => process.exit(code ?? 0));
}

async function main() {
  await ensurePortFree(PORT, HOST);
  runReactScripts();
}

main();
