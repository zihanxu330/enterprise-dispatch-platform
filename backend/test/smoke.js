// Local API smoke checks. No external model calls or real API keys.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;

async function main() {
  process.env.DEEPSEEK_API_KEY = '';
  const { pickBestDispatch } = require('../services/deepseek');
  const originalFetch = global.fetch;
  global.fetch = () => { throw new Error('Unexpected external request'); };
  try {
    await assert.rejects(pickBestDispatch({}, []), /未配置 DEEPSEEK_API_KEY/);
  } finally {
    global.fetch = originalFetch;
  }

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(PORT), DEEPSEEK_API_KEY: '' },
    stdio: 'pipe',
  });
  let serverError = '';
  server.stderr.on('data', data => { serverError += data.toString(); });
  server.stdout.on('data', () => {});
  server.on('error', error => { serverError += error.message; });

  const results = [['No-key dispatch makes no external request', 'PASS']];
  const request = (route, method = 'GET', body) => fetch(BASE + route, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(3000),
  });
  const check = async (name, fn) => {
    try {
      await fn();
      results.push([name, 'PASS']);
    } catch (error) {
      results.push([name, 'FAIL']);
      console.error(name, error.message);
    }
  };

  try {
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      if (server.exitCode !== null) throw new Error('Server exited: ' + serverError);
      try {
        if ((await request('/api/config')).ok) { ready = true; break; }
      } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!ready) throw new Error('Server did not start: ' + serverError);

    await check('GET /api/config', async () => assert.equal((await request('/api/config')).status, 200));
    let stations;
    await check('GET /api/stations', async () => {
      const response = await request('/api/stations');
      assert.equal(response.status, 200);
      stations = await response.json();
      assert.ok(stations.length);
    });
    await check('GET /api/orders', async () => assert.equal((await request('/api/orders')).status, 200));
    await check('Reject missing address', async () =>
      assert.equal((await request('/api/orders', 'POST', { type: 'deep_clean' })).status, 400));

    let order;
    await check('Create a pending order without an API key', async () => {
      const response = await request('/api/orders', 'POST', { type: 'deep_clean', addr: 'Smoke test address' });
      assert.equal(response.status, 201);
      order = await response.json();
      assert.equal(order.status, 'pending');
    });
    await check('Reject completion before dispatch', async () =>
      assert.equal((await request(`/api/orders/${order.id}/complete`, 'PUT')).status, 400));

    const station = stations.find(item => item.workers.some(worker => worker.status === 'available'));
    const worker = station.workers.find(item => item.status === 'available');
    await check('Manual dispatch records station and worker', async () => {
      const response = await request(`/api/orders/${order.id}/dispatch`, 'PUT', { workerId: worker.id });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.order.status, 'enroute');
      assert.equal(data.order.station, station.id);
      assert.equal(data.order.worker, worker.id);
    });
    await check('Complete a dispatched order', async () => {
      const response = await request(`/api/orders/${order.id}/complete`, 'PUT');
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, 'done');
    });
    await check('Reject repeated completion', async () =>
      assert.equal((await request(`/api/orders/${order.id}/complete`, 'PUT')).status, 400));
    await check('Review a completed order', async () =>
      assert.equal((await request(`/api/orders/${order.id}/review`, 'POST', { rating: 5 })).status, 200));
    await check('Cancel a pending order', async () => {
      const response = await request('/api/orders', 'POST', { type: 'deep_clean', addr: 'Cancellation test' });
      assert.equal(response.status, 201);
      const created = await response.json();
      const cancelled = await request(`/api/orders/${created.id}`, 'DELETE', { reason: 'Smoke test' });
      assert.equal(cancelled.status, 200);
      assert.equal((await cancelled.json()).status, 'cancelled');
      assert.equal((await request(`/api/orders/${created.id}/complete`, 'PUT')).status, 400);
    });
    await check('Reject nearest-station query without coordinates', async () =>
      assert.equal((await request('/api/stations/nearest')).status, 400));
    await check('Unknown API returns 404', async () =>
      assert.equal((await request('/api/not-a-route')).status, 404));
  } finally {
    server.kill();
  }

  for (const [name, status] of results) console.log(`${status}  ${name}`);
  const failures = results.filter(([, status]) => status === 'FAIL').length;
  console.log(`\n${results.length - failures}/${results.length} checks passed`);
  if (failures) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
