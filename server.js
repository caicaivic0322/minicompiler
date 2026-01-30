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

// 解析 JSON 请求体
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 保存文件 API
app.post('/api/save', (req, res) => {
  try {
    const { filename, code, language } = req.body;
    
    if (!filename || !code) {
      return res.status(400).send('缺少文件名或代码内容');
    }
    
    // 验证文件扩展名
    const validExtensions = ['.cpp', '.py', '.c', '.h', '.hpp'];
    const ext = path.extname(filename).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return res.status(400).send('不支持的文件类型');
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
    res.status(500).send('保存文件失败: ' + err.message);
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