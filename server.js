import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
app.set('trust proxy', 1);

// 解析 JSON 请求体
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS (for Static Frontend)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const ALLOWED_METHODS = 'GET,POST,PUT,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';
const PISTON_API_KEY = (process.env.PISTON_API_KEY || '').trim(); // Trim to avoid invisible character errors
const PISTON_TIMEOUT_MS = Number(process.env.PISTON_TIMEOUT_MS || 12000);
const PISTON_CACHE_TTL_MS = Number(process.env.PISTON_CACHE_TTL_MS || 5 * 60 * 1000);
const PISTON_CACHE_MAX_ENTRIES = Number(process.env.PISTON_CACHE_MAX_ENTRIES || 100);
const pistonCache = new Map();

const getCacheKey = (code, stdin) => JSON.stringify({ code, stdin: stdin || '' });

const getCachedResult = (cacheKey) => {
  const cached = pistonCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    pistonCache.delete(cacheKey);
    return null;
  }

  pistonCache.delete(cacheKey);
  pistonCache.set(cacheKey, cached);
  return cached.result;
};

const setCachedResult = (cacheKey, result) => {
  if (PISTON_CACHE_TTL_MS <= 0 || PISTON_CACHE_MAX_ENTRIES <= 0) return;

  pistonCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + PISTON_CACHE_TTL_MS,
  });

  while (pistonCache.size > PISTON_CACHE_MAX_ENTRIES) {
    const oldestKey = pistonCache.keys().next().value;
    pistonCache.delete(oldestKey);
  }
};

const fetchWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

// C++ 编译执行 API (代理到 Piston)
app.post('/api/compile/cpp', async (req, res) => {
  const { code, stdin } = req.body;

  console.log('[C++ Compile] Forwarding to Piston API via Proxy...');

  try {
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const cacheKey = getCacheKey(code, stdin);
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      res.setHeader('X-Compiler-Cache', 'HIT');
      return res.json(cachedResult);
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    if (PISTON_API_KEY) {
      headers.Authorization = PISTON_API_KEY;
    }

    const response = await fetchWithTimeout(PISTON_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language: 'cpp',
        version: '10.2.0',
        files: [{ name: 'main.cpp', content: code }],
        stdin: stdin
      }),
    }, PISTON_TIMEOUT_MS);


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const rawText = await response.text();
    let result;
    try {
      result = rawText ? JSON.parse(rawText) : {};
    } catch (err) {
      return res.status(502).json({ error: 'Invalid JSON from Piston', raw: rawText });
    }
    setCachedResult(cacheKey, result);
    res.setHeader('X-Compiler-Cache', 'MISS');
    res.json(result);
  } catch (error) {
    console.log('[C++ Compile] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 健康检查 API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.2' });
});

// API only - no static file serving here

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
