import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function importConstants() {
  const source = await readFile(new URL('../constants.ts', import.meta.url), 'utf8');
  const testableSource = source.replace(
    "import { Language, ThemeKey, ExampleSnippet } from './types';",
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

test('default C++ snippet is a simple hello world starter', async () => {
  const { DEFAULT_CPP_CODE } = await importConstants();

  assert.match(DEFAULT_CPP_CODE, /#include <iostream>/);
  assert.match(DEFAULT_CPP_CODE, /Hello, World!/);
  assert.doesNotMatch(DEFAULT_CPP_CODE, /#include <bits\/stdc\+\+\.h>/);
});

test('C++ examples include common contest templates', async () => {
  const { CPP_EXAMPLES } = await importConstants();
  const exampleNames = CPP_EXAMPLES.map((example) => example.name);

  assert.ok(exampleNames.includes('Contest Starter'));
  assert.ok(exampleNames.includes('Binary Search'));
  assert.ok(exampleNames.includes('BFS Shortest Path'));
  assert.ok(exampleNames.includes('Disjoint Set Union'));
});
