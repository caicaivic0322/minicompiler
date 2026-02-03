import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

const DATA_ROOT = process.env.RENDER_DATA_DIR || process.env.DATA_DIR || __dirname;
const SAVE_DIR = path.join(DATA_ROOT, 'saved-files');
const USERS_FILE = path.join(DATA_ROOT, 'users.json');

// 确保保存目录存在
if (!fs.existsSync(DATA_ROOT)) {
  fs.mkdirSync(DATA_ROOT, { recursive: true });
}
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

let USERS = {}; 
// Token 存储
const validTokens = new Set();
const loginAttempts = new Map();

// 简单的 Token 生成器
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const LOGIN_RATE_WINDOW_MS = Number.parseInt(process.env.LOGIN_RATE_WINDOW_MS || '60000', 10);
const LOGIN_RATE_MAX = Number.parseInt(process.env.LOGIN_RATE_MAX || '5', 10);

const loadUsers = () => {
  if (!fs.existsSync(USERS_FILE)) {
    USERS = {};
    return;
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') {
      USERS = parsed;
      return;
    }
  } catch (err) {
  }
  USERS = {};
};

const persistUsers = () => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(USERS, null, 2), 'utf-8');
};

loadUsers();

// 解析 JSON 请求体
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 健康检查 API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.1' });
});

// 注册 API
app.post('/api/register', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名或密码不能为空' });
    }

    if (USERS[username]) {
      return res.status(409).json({ success: false, message: '用户已存在' });
    }

    // 注册成功，保存用户
    USERS[username] = password;
    try {
      persistUsers();
    } catch (err) {
      delete USERS[username];
      return res.status(500).json({ success: false, message: '用户保存失败' });
    }
    console.log(`新用户注册: ${username}`);

    // 自动登录
    const token = generateToken();
    validTokens.add(token);
    
    res.json({ 
      success: true, 
      token,
      username,
      message: '注册成功'
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ success: false, message: '注册失败: ' + err.message });
  }
});

// 登录 API
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名或密码不能为空' });
    }

    const clientKey = `${req.ip || 'unknown'}|${username}`;
    const now = Date.now();
    const windowStart = now - LOGIN_RATE_WINDOW_MS;
    const attempts = loginAttempts.get(clientKey) || [];
    const recentAttempts = attempts.filter((ts) => ts > windowStart);

    if (recentAttempts.length >= LOGIN_RATE_MAX) {
      loginAttempts.set(clientKey, recentAttempts);
      return res.status(429).json({ success: false, message: '登录尝试过多，请稍后再试' });
    }
    
    if (USERS[username] && USERS[username] === password) {
      loginAttempts.delete(clientKey);
      const token = generateToken();
      validTokens.add(token);
      
      console.log(`用户登录成功: ${username}`);
      res.json({ 
        success: true, 
        token,
        username 
      });
    } else {
      recentAttempts.push(now);
      loginAttempts.set(clientKey, recentAttempts);
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 登出 API
app.post('/api/logout', (req, res) => {
  try {
    const { token } = req.body;
    validTokens.delete(token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 验证 Token API
app.post('/api/verify', (req, res) => {
  try {
    const { token } = req.body;
    res.json({ valid: validTokens.has(token) });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 保存文件 API
app.post('/api/save', (req, res) => {
  try {
    const { filename, code, language, token } = req.body;
    
    // 验证 Token
    if (!token || !validTokens.has(token)) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    if (!filename || !code) {
      return res.status(400).json({ success: false, message: '缺少文件名或代码内容' });
    }
    
    // 验证文件扩展名
    const validExtensions = ['.cpp', '.py', '.c', '.h', '.hpp'];
    const ext = path.extname(filename).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return res.status(400).json({ success: false, message: '不支持的文件类型' });
    }
    
    // 安全处理文件名，防止路径穿越
    const safeName = path.basename(filename);
    const filePath = path.join(SAVE_DIR, safeName);
    
    // 写入文件
    fs.writeFileSync(filePath, code, 'utf-8');
    
    console.log(`文件已保存: ${safeName}`);
    res.status(200).json({ 
      success: true, 
      message: `文件 "${safeName}" 保存成功`,
      path: filePath 
    });
  } catch (err) {
    console.error('保存文件失败:', err);
    res.status(500).json({ success: false, message: '保存文件失败: ' + err.message });
  }
});

// 获取已保存文件列表 API
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(SAVE_DIR).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.cpp', '.py', '.c', '.h', '.hpp'].includes(ext);
    });
    
    const fileList = files.map(file => ({
      name: file,
      path: path.join(SAVE_DIR, file),
      size: fs.statSync(path.join(SAVE_DIR, file)).size,
      modified: fs.statSync(path.join(SAVE_DIR, file)).mtime
    }));
    
    res.json(fileList);
  } catch (err) {
    console.error('获取文件列表失败:', err);
    res.status(500).send('获取文件列表失败');
  }
});

app.all('/api/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const safeName = path.basename(filename);
  const filePath = path.join(SAVE_DIR, safeName);

  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('文件不存在');
      }

      const code = fs.readFileSync(filePath, 'utf-8');
      return res.json({ name: safeName, code });
    } catch (err) {
      return res.status(500).send('读取文件失败');
    }
  }

  if (req.method === 'DELETE') {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !validTokens.has(token)) {
      return res.status(401).send('请先登录');
    }

    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('文件不存在');
      }

      fs.unlinkSync(filePath);
      console.log(`文件已删除: ${safeName}`);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).send('删除文件失败');
    }
  }

  return res.status(405).send('Method not allowed');
});

// 处理所有路由请求，返回index.html以支持SPA应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
