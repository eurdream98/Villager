/**
 * CRA는 3000이 점유되면 터미널에서 "다른 포트 쓸까요?" 를 묻습니다.
 * 3000–3010 정리 → LISTEN 확인 → CRA는 항상 PORT(3000) 고정(프롬프트 없음).
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const kill = require('kill-port');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || 'localhost';
const PORT_SPAN = 11;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function killDevPortRange() {
  await Promise.all(
    Array.from({ length: PORT_SPAN }, (_, i) =>
      kill(PORT + i).catch(() => {}),
    ),
  );
}

/** LISTEN 중인 포트만 확인 (bind 테스트로 TIME_WAIT 유발하지 않음) */
function listeningPortsInRange() {
  const ports = Array.from({ length: PORT_SPAN }, (_, i) => PORT + i);
  if (process.platform === 'win32') {
    try {
      const list = ports.join(',');
      const out = execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(${list}) } | Select-Object -ExpandProperty LocalPort -Unique"`,
        { encoding: 'utf8' },
      );
      return out
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => Number(p));
    } catch {
      return [];
    }
  }
  try {
    const out = execSync(`lsof -iTCP -sTCP:LISTEN -P -n`, { encoding: 'utf8' });
    return ports.filter((p) => new RegExp(`:${p}\\s`).test(out));
  } catch {
    return [];
  }
}

/**
 * bind 테스트(detect)는 TIME_WAIT를 만들어 checkBrowsers 직후 CRA choosePort가
 * 실패할 수 있으므로, LISTEN 여부만 보고 CRA에 포트 확인을 맡깁니다.
 */
async function ensurePortFree(maxAttempts = 12) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await killDevPortRange();
    await sleep(2500);

    const listening = listeningPortsInRange();
    if (listening.length > 0) {
      console.log(
        `포트 ${listening.join(', ')} LISTEN 중… (${attempt}/${maxAttempts})`,
      );
      continue;
    }

    console.log(`Port ${PORT} (${HOST}) — LISTEN 없음, CRA 시작`);
    return;
  }
  console.error(
    `\n포트 ${PORT}을(를) 비우지 못했습니다.\n` +
      '  npm run stop:dev\n' +
      '  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force\n',
  );
  process.exit(1);
}

function runReactScripts() {
  const script = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-scripts',
    'scripts',
    'start.js',
  );
  const forcePort = path.join(__dirname, 'force-port-detect.js');
  const nodeOptions = [process.env.NODE_OPTIONS, `--require`, forcePort]
    .filter(Boolean)
    .join(' ');

  const env = {
    ...process.env,
    PORT: String(PORT),
    HOST,
    NODE_OPTIONS: nodeOptions,
  };

  const child = spawn(process.execPath, [script], {
    stdio: 'inherit',
    env,
    shell: false,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

async function main() {
  await ensurePortFree();
  runReactScripts();
}

main();
