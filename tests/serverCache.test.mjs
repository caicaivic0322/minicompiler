import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import test from 'node:test';

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });

const waitForHealth = async (url) => {
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('server did not become healthy');
};

test('C++ proxy caches identical Piston executions', async () => {
  let upstreamRequests = 0;
  const upstream = http.createServer((req, res) => {
    upstreamRequests += 1;
    req.resume();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ run: { stdout: 'cached-output\n', code: 0 } }));
  });
  const upstreamPort = await listen(upstream);

  const appPort = 24000 + Math.floor(Math.random() * 1000);
  const app = spawn(process.execPath, ['server.js'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(appPort),
      PISTON_API_URL: `http://127.0.0.1:${upstreamPort}/execute`,
      PISTON_CACHE_TTL_MS: '60000',
      PISTON_CACHE_MAX_ENTRIES: '20',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForHealth(`http://127.0.0.1:${appPort}`);
    const body = JSON.stringify({ code: 'int main(){return 0;}', stdin: '' });

    for (let i = 0; i < 2; i++) {
      const response = await fetch(`http://127.0.0.1:${appPort}/api/compile/cpp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { run: { stdout: 'cached-output\n', code: 0 } });
    }

    assert.equal(upstreamRequests, 1);
  } finally {
    app.kill();
    await new Promise((resolve) => upstream.close(resolve));
  }
});
