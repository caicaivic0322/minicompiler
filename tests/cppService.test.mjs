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

test('runCppCode always sends code to the backend Piston proxy', async () => {
  delete globalThis.JSCPP;
  let backendCalls = 0;

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
    backendCalls += 1;
    assert.equal(url, '/api/compile/cpp');
    assert.deepEqual(JSON.parse(options.body), {
      code: 'int main(){ return 0; }',
      stdin: '',
    });
    return {
      ok: true,
      json: async () => ({ run: { stdout: 'Hello from backend\n', code: 0 } }),
    };
  };

  const { runCppCode } = await importTypeScriptModule(
    new URL('../services/cppService.ts', import.meta.url),
  );
  const output = [];

  await runCppCode('int main(){ return 0; }', '', (text) => output.push(text));

  assert.equal(backendCalls, 1);
  assert.match(output.join(''), /C\+\+ runner: Render\/Piston/);
  assert.match(output.join(''), /Backend response:/);
  assert.match(output.join(''), /Hello from backend/);
  assert.doesNotMatch(output.join(''), /Local JSCPP/);
});
