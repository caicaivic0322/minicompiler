import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function importTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const testableSource = source.replace(
    "import { buildApiUrl } from '../constants';",
    "const buildApiUrl = (path: string) => path;",
  );
  const { outputText } = ts.transpileModule(testableSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const encoded = Buffer.from(`${outputText}\n// cache-bust: ${Date.now()}-${Math.random()}`).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

test('runCppCode reports backend health, Piston timing, and cache status', async () => {
  delete globalThis.JSCPP;
  let backendCalls = 0;
  const requestedUrls = [];

  globalThis.document = {
    createElement() {
      throw new Error('local JSCPP should not be loaded');
    },
  };
  globalThis.window = {
    location: { origin: 'http://127.0.0.1:3000' },
  };
  globalThis.Worker = class {};
  globalThis.fetch = async (url, options) => {
    requestedUrls.push(url);
    if (url === '/api/health') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', version: '1.0.3' }),
      };
    }

    backendCalls += 1;
    assert.equal(url, '/api/compile/cpp');
    assert.deepEqual(JSON.parse(options.body), {
      code: 'int main(){ return 0; }',
      stdin: '',
    });
    return {
      ok: true,
      status: 200,
      headers: {
        get(name) {
          return name.toLowerCase() === 'x-compiler-cache' ? 'HIT' : null;
        },
      },
      json: async () => ({ run: { stdout: 'Hello from backend\n', code: 0 } }),
    };
  };

  const { runCppCode } = await importTypeScriptModule(
    new URL('../services/cppService.ts', import.meta.url),
  );
  const output = [];

  await runCppCode('int main(){ return 0; }', '', (text) => output.push(text));

  assert.equal(backendCalls, 1);
  assert.deepEqual(requestedUrls, ['/api/health', '/api/compile/cpp']);
  assert.match(output.join(''), /C\+\+ runner: Render\/Piston/);
  assert.match(output.join(''), /Backend API: online/);
  assert.match(output.join(''), /Cache: HIT/);
  assert.match(output.join(''), /Piston response:/);
  assert.match(output.join(''), /Hello from backend/);
  assert.doesNotMatch(output.join(''), /Local JSCPP/);
});

test('runCppCode explains an unavailable Render backend in Chinese', async () => {
  globalThis.window = {
    location: { origin: 'http://127.0.0.1:3000' },
  };
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable',
    text: async () => 'Service Suspended',
  });

  const { runCppCode } = await importTypeScriptModule(
    new URL('../services/cppService.ts', import.meta.url),
  );
  const output = [];

  await assert.rejects(
    runCppCode('int main(){ return 0; }', '', (text) => output.push(text)),
    /后端服务暂时不可用/,
  );

  assert.match(output.join(''), /后端服务暂时不可用/);
  assert.match(output.join(''), /Render/);
});
