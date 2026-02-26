import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
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

// C++ 编译执行 API (代理到 Piston)
app.post('/api/compile/cpp', async (req, res) => {
  const { code, stdin } = req.body;

  console.log('[C++ Compile] Forwarding to Piston API...');

  try {
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'cpp',
        version: '10.2.0',
        files: [{ content: code }],
        stdin: stdin
      }),
    });

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
