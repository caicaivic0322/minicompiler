import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 保存文件的目录
const SAVE_DIR = path.join(__dirname, 'saved-files');

// 确保保存目录存在
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

// 用户存储（内存中，生产环境应使用数据库）
const USERS = {}; 
// Token 存储
const validTokens = new Set();

// 简单的 Token 生成器
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

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
    
    if (USERS[username] && USERS[username] === password) {
      const token = generateToken();
      validTokens.add(token);
      
      console.log(`用户登录成功: ${username}`);
      res.json({ 
        success: true, 
        token,
        username 
      });
    } else {
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

// 处理所有路由请求，返回index.html以支持SPA应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});