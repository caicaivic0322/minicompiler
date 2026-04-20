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
  const encoded = Buffer.from(`${outputText}\n// cache-bust: ${Date.now()}`).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

test('runCppCode uses the local JSCPP runner before calling the backend', async () => {
  let scriptElement;
  globalThis.document = {
    createElement() {
      scriptElement = {};
      return scriptElement;
    },
    body: {
      appendChild(node) {
        queueMicrotask(() => {
          globalThis.JSCPP = {
            WebWorkerHelper: class {
              run(_code, _stdin, options, callback) {
                options.stdio.write('Hello from local JSCPP\n');
                callback(null);
              }
              worker = { terminate() {} };
            },
          };
          node.onload?.({});
        });
        return node;
      },
    },
  };
  globalThis.window = {
    location: { origin: 'http://127.0.0.1:3000' },
  };
  globalThis.Worker = class {};
  globalThis.fetch = async () => {
    throw new Error('backend should not be called');
  };

  const { runCppCode } = await importTypeScriptModule(
    new URL('../services/cppService.ts', import.meta.url),
  );
  const output = [];

  await runCppCode('int main(){ return 0; }', '', (text) => output.push(text));

  assert.equal(scriptElement.src, '/libs/JSCPP.es5.min.js');
  assert.equal(output.join(''), 'Hello from local JSCPP\n');
});
