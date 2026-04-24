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

const BACKEND_TIMEOUT_MS = 12000;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const formatDuration = (durationMs: number) => {
  return `${durationMs < 100 ? durationMs.toFixed(1) : durationMs.toFixed(0)}ms`;
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
  onOutput(`[System] C++ runner: Render/Piston.\n`);

  try {
    const apiUrl = buildApiUrl('/api/compile/cpp');
    const backendStart = now();
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

    onOutput(`[System] Backend response: ${formatDuration(now() - backendStart)}.\n`);

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
    onOutput(`\n[Error] ${msg}`);
    throw err;
  }
};
