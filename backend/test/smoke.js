// 冒烟测试：启动服务后验证核心 API 是否可响应（黑盒，无外部依赖）
const { spawn } = require('child_process');
const path = require('path');

const SERVER = path.join(__dirname, '..', 'server.js');
const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;

async function main() {
  const server = spawn('node', [SERVER], {
    env: { ...process.env, PORT: String(PORT), DEEPSEEK_API_KEY: 'sk-smoke-test' },
    stdio: 'pipe',
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', (d) => process.stderr.write(d));

  // 等待服务就绪
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/api/config`);
      if (r.ok) break;
    } catch (_) {}
    await new Promise((res) => setTimeout(res, 200));
  }

  const results = [];
  const check = async (name, fn) => {
    try {
      const ok = await fn();
      results.push([name, ok ? 'PASS' : 'FAIL']);
    } catch (e) {
      results.push([name, 'FAIL']);
    }
  };

  await check('GET /api/config', async () => (await fetch(`${BASE}/api/config`)).ok);
  await check('GET /api/stations', async () => (await fetch(`${BASE}/api/stations`)).ok);
  await check('GET /api/orders', async () => (await fetch(`${BASE}/api/orders`)).ok);
  await check('POST /api/orders (missing addr -> 400)', async () => {
    const r = await fetch(`${BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'deep_clean' }),
    });
    return r.status === 400;
  });
  await check('POST /api/orders (valid -> 201)', async () => {
    const r = await fetch(`${BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'deep_clean', addr: '测试地址' }),
    });
    return r.status === 201;
  });
  await check('GET /api/stations/nearest (missing params -> 400)', async () => {
    const r = await fetch(`${BASE}/api/stations/nearest`);
    return r.status === 400;
  });

  server.kill();

  let failed = 0;
  for (const [name, status] of results) {
    console.log(`${status}  ${name}`);
    if (status === 'FAIL') failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
