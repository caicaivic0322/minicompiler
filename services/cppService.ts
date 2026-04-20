import { buildApiUrl } from '../constants';

interface CompileResponse {
  compile?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    signal?: string | null;
    output?: string;
  };
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    signal?: string | null;
    output?: string;
  };
  message?: string;
  error?: string;
}

interface LocalCppResult {
  ok: boolean;
  output: string;
  error?: string;
}

const JSCPP_SCRIPT_PATH = '/libs/JSCPP.es5.min.js';
const BACKEND_TIMEOUT_MS = 12000;
const LOCAL_TIMEOUT_MS = 5000;

let jscppLoadPromise: Promise<void> | null = null;

const getJscpp = () => (globalThis as any).JSCPP;

const canUseLocalCppRunner = () => {
  return (
    typeof document !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof window !== 'undefined'
  );
};

const loadJscpp = async (): Promise<void> => {
  if (getJscpp()?.WebWorkerHelper) return;

  if (!jscppLoadPromise) {
    jscppLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = JSCPP_SCRIPT_PATH;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load local C++ runner.'));
      document.body.appendChild(script);
    });
  }

  await jscppLoadPromise;

  if (!getJscpp()?.WebWorkerHelper) {
    throw new Error('Local C++ runner is unavailable.');
  }
};

const runCppLocally = async (code: string, stdin: string): Promise<LocalCppResult> => {
  if (!canUseLocalCppRunner()) {
    return { ok: false, output: '', error: 'Local C++ runner requires a browser Worker.' };
  }

  try {
    await loadJscpp();
  } catch (err: any) {
    return { ok: false, output: '', error: err?.message || String(err) };
  }

  return new Promise((resolve) => {
    const output: string[] = [];
    let settled = false;
    let runner: any = null;

    const finish = (result: LocalCppResult) => {
      if (settled) return;
      settled = true;
      if (runner?.worker?.terminate) runner.worker.terminate();
      resolve(result);
    };

    const timeout = setTimeout(() => {
      finish({
        ok: false,
        output: output.join(''),
        error: 'Local C++ execution timed out.',
      });
    }, LOCAL_TIMEOUT_MS);

    try {
      const JSCPP = getJscpp();
      runner = new JSCPP.WebWorkerHelper(JSCPP_SCRIPT_PATH);
      runner.run(
        code,
        stdin || '',
        {
          stdio: {
            write: (text: string) => output.push(text),
          },
        },
        (err: any) => {
          clearTimeout(timeout);
          if (err) {
            finish({
              ok: false,
              output: output.join(''),
              error: err?.message || String(err),
            });
            return;
          }
          finish({ ok: true, output: output.join('') });
        },
      );
    } catch (err: any) {
      clearTimeout(timeout);
      finish({
        ok: false,
        output: output.join(''),
        error: err?.message || String(err),
      });
    }
  });
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const initCpp = async (): Promise<void> => {
  return Promise.resolve();
};

export const runCppCode = async (
  code: string,
  stdin: string,
  onOutput: (text: string) => void
): Promise<void> => {
  const localResult = await runCppLocally(code, stdin);
  if (localResult.ok) {
    onOutput(localResult.output);
    return;
  }

  onOutput(`[System] Local C++ runner unavailable or unsupported. Falling back to backend...\n`);

  try {
    const apiUrl = buildApiUrl('/api/compile/cpp');
    const response = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        stdin,
      }),
    }, BACKEND_TIMEOUT_MS);


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request failed: ${response.status} ${response.statusText}${errorText ? `\n${errorText}` : ''}`);
    }

    const result: CompileResponse = await response.json();

    if (result.message) {
      throw new Error(result.message);
    }

    let hasFailure = false;

    if (result.compile && result.compile.stderr) {
      onOutput(`[Compile Error]\n${result.compile.stderr}\n`);
      hasFailure = true;
    }

    if (result.run) {
      if (result.run.stdout) {
        onOutput(result.run.stdout);
      }
      if (result.run.stderr) {
        onOutput(`\n[Runtime Error]\n${result.run.stderr}\n`);
        hasFailure = true;
      }
      if (typeof result.run.code === 'number' && result.run.code !== 0) {
        onOutput(`\n[System] Process exited with code ${result.run.code}\n`);
        hasFailure = true;
      }
    }

    if (hasFailure) {
      throw new Error('C++ execution failed.');
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (localResult.error) {
      onOutput(`[Local Runner Error]\n${localResult.error}\n`);
    }
    onOutput(`\n[Error] ${msg}`);
    throw err;
  }
};
