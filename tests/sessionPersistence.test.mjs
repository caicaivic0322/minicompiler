import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function importTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const testableSource = source.replace(
    "import { EditorTab, Language } from '../types';",
    "const Language = { PYTHON: 'python', CPP: 'cpp' };",
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

test('serializeEditorSession stores tabs, active tab, and stdin', async () => {
  const { serializeEditorSession } = await importTypeScriptModule(
    new URL('../services/sessionPersistence.ts', import.meta.url),
  );

  const serialized = serializeEditorSession(
    [{ id: '1', title: 'main.py', code: 'print(1)', language: 'python' }],
    '1',
    '42\n',
  );

  assert.equal(serialized.version, 1);
  assert.equal(serialized.activeTabId, '1');
  assert.equal(serialized.stdin, '42\n');
  assert.deepEqual(serialized.tabs, [
    { id: '1', title: 'main.py', code: 'print(1)', language: 'python' },
  ]);
});

test('parseEditorSession rejects invalid saved data and repairs a missing active tab', async () => {
  const { parseEditorSession } = await importTypeScriptModule(
    new URL('../services/sessionPersistence.ts', import.meta.url),
  );

  assert.equal(parseEditorSession('{bad json'), null);
  assert.equal(parseEditorSession(JSON.stringify({ version: 1, tabs: [] })), null);

  const repaired = parseEditorSession(JSON.stringify({
    version: 1,
    tabs: [
      { id: 'a', title: 'main.cpp', code: 'int main(){}', language: 'cpp' },
    ],
    activeTabId: 'missing',
    stdin: 'input',
  }));

  assert.equal(repaired.activeTabId, 'a');
  assert.equal(repaired.stdin, 'input');
});

test('preferPythonStartupSession opens only one existing Python tab on page load', async () => {
  const { preferPythonStartupSession } = await importTypeScriptModule(
    new URL('../services/sessionPersistence.ts', import.meta.url),
  );

  const session = {
    version: 1,
    tabs: [
      { id: 'cpp', title: 'main.cpp', code: 'int main(){}', language: 'cpp' },
      { id: 'py', title: 'main.py', code: 'print(1)', language: 'python' },
    ],
    activeTabId: 'cpp',
    stdin: '',
  };

  const preferred = preferPythonStartupSession(session, {
    id: 'default-python',
    title: 'main.py',
    code: 'print("Hello, World!")',
    language: 'python',
  });

  assert.equal(preferred.activeTabId, 'py');
  assert.deepEqual(preferred.tabs, [
    { id: 'py', title: 'main.py', code: 'print(1)', language: 'python' },
  ]);
});

test('preferPythonStartupSession opens only the default Python tab when saved tabs are C++ only', async () => {
  const { preferPythonStartupSession } = await importTypeScriptModule(
    new URL('../services/sessionPersistence.ts', import.meta.url),
  );

  const preferred = preferPythonStartupSession({
    version: 1,
    tabs: [
      { id: '1', title: 'a.cpp', code: 'int main(){}', language: 'cpp' },
      { id: '2', title: 'b.cpp', code: 'int main(){}', language: 'cpp' },
      { id: '3', title: 'c.cpp', code: 'int main(){}', language: 'cpp' },
    ],
    activeTabId: '2',
    stdin: '7',
  }, {
    id: '1',
    title: 'main.py',
    code: 'print("Hello, World!")',
    language: 'python',
  });

  assert.equal(preferred.tabs[0].language, 'python');
  assert.equal(preferred.tabs[0].id, '1');
  assert.equal(preferred.activeTabId, '1');
  assert.equal(preferred.tabs.length, 1);
  assert.equal(preferred.stdin, '7');
});
