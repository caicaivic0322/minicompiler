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
const BACKEND_HEALTH_TIMEOUT_MS = 3000;

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

const readResponseText = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

const extractErrorDetail = (bodyText: string) => {
  if (!bodyText) return '';

  try {
    const parsed = JSON.parse(bodyText);
    return parsed?.error || parsed?.message || bodyText;
  } catch {
    return bodyText;
  }
};

const createHttpError = (response: Response, bodyText: string, target: string) => {
  const detail = extractErrorDetail(bodyText);
  const details = detail ? `\n${detail}` : '';

  if (/Piston API 未授权|whitelist|PISTON_API_KEY|PISTON_API_URL/i.test(detail)) {
    return new Error(detail);
  }

  if (response.status === 503) {
    return new Error(
      `${target}暂时不可用（HTTP 503）。Render 服务可能已暂停、正在冷启动，或没有成功部署。请先确认 Render API 服务在线后重试。${details}`,
    );
  }

  if (response.status === 404) {
    return new Error(
      `${target}地址不存在（HTTP 404）。请检查 VITE_API_BASE_URL 是否指向 minicompiler-api 服务。${details}`,
    );
  }

  if (response.status >= 500) {
    return new Error(
      `${target}返回服务器错误（HTTP ${response.status} ${response.statusText}）。这通常来自 Render 后端或 Piston API。${details}`,
    );
  }

  return new Error(
    `${target}请求失败（HTTP ${response.status} ${response.statusText}）。${details}`,
  );
};

const createFetchError = (error: any, target: string, timeoutMs: number) => {
  if (error?.name === 'AbortError') {
    return new Error(`${target}响应超时（超过 ${Math.round(timeoutMs / 1000)} 秒）。请稍后重试，或检查 Render/Piston 是否响应过慢。`);
  }

  if (error instanceof TypeError) {
    return new Error(`无法连接${target}。请检查 VITE_API_BASE_URL、Render 服务状态和浏览器网络连接。`);
  }

  return error instanceof Error ? error : new Error(String(error));
};

const checkBackendHealth = async (onOutput: (text: string) => void) => {
  const healthUrl = buildApiUrl('/api/health');
  const healthStart = now();

  try {
    const response = await fetchWithTimeout(healthUrl, {
      method: 'GET',
    }, BACKEND_HEALTH_TIMEOUT_MS);

    if (!response.ok) {
      throw createHttpError(response, await readResponseText(response), '后端服务');
    }

    let version = '';
    try {
      const body = await response.json();
      version = body?.version ? `, v${body.version}` : '';
    } catch {
      version = '';
    }

    onOutput(`[System] Backend API: online (${formatDuration(now() - healthStart)}${version}).\n`);
  } catch (error: any) {
    throw createFetchError(error, '后端服务', BACKEND_HEALTH_TIMEOUT_MS);
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
    await checkBackendHealth(onOutput);

    const apiUrl = buildApiUrl('/api/compile/cpp');
    const pistonStart = now();
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
      throw createHttpError(response, await readResponseText(response), 'Piston 代理');
    }

    const result: CompileResponse = await response.json();

    if (result.message) {
      throw new Error(result.message);
    }

    const cacheStatus = response.headers?.get?.('X-Compiler-Cache') || 'UNKNOWN';
    onOutput(`[System] Piston response: ${formatDuration(now() - pistonStart)}. Cache: ${cacheStatus}.\n`);

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
    const friendlyError = createFetchError(err, '后端服务', BACKEND_TIMEOUT_MS);
    const msg = friendlyError?.message || String(err);
    onOutput(`\n[Error] ${msg}`);
    throw friendlyError;
  }
};
