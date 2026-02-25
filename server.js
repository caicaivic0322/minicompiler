import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

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

// C++ 编译执行 API
app.post('/api/compile/cpp', async (req, res) => {
  const { code, stdin } = req.body;

  console.log('[C++ Compile] Received request, code length:', code?.length);

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const id = crypto.randomBytes(8).toString('hex');
  const sourceFile = `/tmp/${id}.cpp`;
  const exeFile = `/tmp/${id}`;

  try {
    fs.writeFileSync(sourceFile, code, 'utf8');
    console.log('[C++ Compile] File written:', sourceFile);

    const compileCmd = `g++ -std=c++17 -o ${exeFile} ${sourceFile}`;
    console.log('[C++ Compile] Running:', compileCmd);

    const result = await new Promise((resolve, reject) => {
      exec(compileCmd, (error, stdout, stderr) => {
        if (error) {
          console.log('[C++ Compile] Compile error:', error.message);
          try { fs.unlinkSync(sourceFile); } catch (e) {}
          resolve({
            success: false,
            stdout: '',
            stderr: stderr || error.message,
            code: error.code || 1
          });
          return;
        }

        if (stderr && stderr.trim()) {
          console.log('[C++ Compile] Compile warning:', stderr);
          try { fs.unlinkSync(sourceFile); } catch (e) {}
          resolve({
            success: false,
            stdout: '',
            stderr: stderr,
            code: 1
          });
          return;
        }

        console.log('[C++ Compile] Compiled successfully, running...');
        exec(exeFile, { input: stdin || '', timeout: 5000 }, (runError, runStdout, runStderr) => {
          try {
            fs.unlinkSync(sourceFile);
            fs.unlinkSync(exeFile);
          } catch (e) {}

          if (runError) {
            console.log('[C++ Compile] Run error:', runError.message);
            resolve({
              success: false,
              stdout: runStdout || '',
              stderr: runStderr || runError.message,
              code: runError.code || 1
            });
            return;
          }

          console.log('[C++ Compile] Success, output:', runStdout);
          resolve({
            success: true,
            stdout: runStdout || '',
            stderr: runStderr || '',
            code: 0
          });
        });
      });
    });

    res.json(result);
  } catch (error) {
    console.log('[C++ Compile] Server error:', error.message);
    try {
      fs.unlinkSync(sourceFile);
      fs.unlinkSync(exeFile);
    } catch (e) {}
    res.status(500).json({ error: error.message });
  }
});

// 健康检查 API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.1' });
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
