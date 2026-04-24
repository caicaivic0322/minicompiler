import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function importTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const encoded = Buffer.from(`${outputText}\n// cache-bust: ${Date.now()}`).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

test('runPythonCode flushes Python output that does not end with a newline', async () => {
  let stdoutOptions;

  const fakePyodide = {
    setStdout(options) {
      stdoutOptions = options;
    },
    setStderr() {},
    setStdin() {},
    async runPythonAsync(code) {
      if (!code.includes('sys.stdout.flush')) return;

      const bytes = new TextEncoder().encode('0 1 2 3 4 5 ');
      bytes.forEach((byte) => stdoutOptions?.raw?.(byte));
    },
  };

  globalThis.window = {
    loadPyodide: async () => fakePyodide,
  };
  globalThis.document = {
    createElement() {
      return {};
    },
    body: {
      appendChild(node) {
        queueMicrotask(() => node.onload?.({}));
        return node;
      },
    },
  };

  const { runPythonCode } = await importTypeScriptModule(
    new URL('../services/pyodideService.ts', import.meta.url),
  );
  const output = [];

  await runPythonCode(
    "for i in range(6):\n    print(i, end=' ')",
    '',
    (text) => output.push(text),
  );

  assert.equal(output.join(''), '0 1 2 3 4 5 ');
});

test('runPythonCode wraps user code with a timeout guard and rejects Python failures', async () => {
  let userExecutionCode = '';

  const fakePyodide = {
    setStdout() {},
    setStderr() {},
    setStdin() {},
    async runPythonAsync(code) {
      if (code.includes('sys.stdout.flush')) return;

      userExecutionCode = code;
      throw new Error('Traceback (most recent call last):\nEOFError: EOF when reading a line');
    },
  };

  globalThis.window = {
    loadPyodide: async () => fakePyodide,
  };
  globalThis.document = {
    createElement() {
      return {};
    },
    body: {
      appendChild(node) {
        queueMicrotask(() => node.onload?.({}));
        return node;
      },
    },
  };

  const { runPythonCode } = await importTypeScriptModule(
    new URL('../services/pyodideService.ts', import.meta.url),
  );
  const output = [];

  await assert.rejects(
    runPythonCode('name = input()', '', (text) => output.push(text)),
    /Python execution failed/,
  );

  assert.match(userExecutionCode, /sys\.settrace/);
  assert.match(userExecutionCode, /TimeoutError/);
  assert.match(output.join(''), /输入不足/);
});
