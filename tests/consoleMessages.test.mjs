import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function importTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const testableSource = source.replace(
    "import { ConsoleMessage } from '../types';",
    '',
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

test('getConsoleMessageGroups hides system diagnostics by default', async () => {
  const { getConsoleMessageGroups } = await importTypeScriptModule(
    new URL('../components/consoleMessages.ts', import.meta.url),
  );

  const messages = [
    { type: 'system', content: 'C++ runner: Render/Piston.', timestamp: 1 },
    { type: 'info', content: 'Hello, World!', timestamp: 2 },
    { type: 'success', content: 'Program exited successfully.', timestamp: 3 },
  ];

  assert.deepEqual(getConsoleMessageGroups(messages, false), {
    visibleMessages: [messages[1], messages[2]],
    diagnosticMessages: [messages[0]],
  });
});

test('getConsoleMessageGroups includes diagnostics when expanded', async () => {
  const { getConsoleMessageGroups } = await importTypeScriptModule(
    new URL('../components/consoleMessages.ts', import.meta.url),
  );

  const messages = [
    { type: 'system', content: 'Backend API: online.', timestamp: 1 },
    { type: 'info', content: '42', timestamp: 2 },
  ];

  assert.deepEqual(getConsoleMessageGroups(messages, true), {
    visibleMessages: messages,
    diagnosticMessages: [messages[0]],
  });
});
