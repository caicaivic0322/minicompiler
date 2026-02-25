import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node:fetch';

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

// C++ 编译执行 API (代理到 Piston)
app.post('/api/compile/cpp', async (req, res) => {
  const { code, stdin } = req.body;

  console.log('[C++ Compile] Forwarding to Piston API...');

  try {
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
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
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

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 处理所有路由请求，返回index.html以支持SPA应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
