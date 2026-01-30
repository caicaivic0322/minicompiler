import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

// 保存文件的目录
const SAVE_DIR = path.resolve(__dirname, 'saved-files');

// 确保保存目录存在
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

// 简单的用户验证（生产环境应使用更安全的方式）
const USERS: Record<string, string> = {
  'admin': 'admin123',
  'teacher': 'teacher123'
};

// 存储登录状态的 token（简单实现，生产环境应使用 JWT 等）
const validTokens = new Set<string>();

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 开发服务器 API 插件
function devServerApi(): PluginOption {
  return {
    name: 'dev-server-api',
    configureServer(server) {
      // 注册 API
      server.middlewares.use('/api/register', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { username, password } = JSON.parse(body);
            
            if (!username || !password) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: '用户名或密码不能为空' }));
              return;
            }

            if (USERS[username]) {
              res.statusCode = 409;
              res.end(JSON.stringify({ success: false, message: '用户已存在' }));
              return;
            }

            // 注册成功，保存用户
            USERS[username] = password;
            console.log(`[DEV] 新用户注册: ${username}`);

            // 自动登录
            const token = generateToken();
            validTokens.add(token);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              token,
              username,
              message: '注册成功'
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end('注册失败');
          }
        });
      });

      // 登录 API
      server.middlewares.use('/api/login', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { username, password } = JSON.parse(body);
            
            if (USERS[username] && USERS[username] === password) {
              const token = generateToken();
              validTokens.add(token);
              
              console.log(`[DEV] 用户登录成功: ${username}`);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                token,
                username 
              }));
            } else {
              res.statusCode = 401;
              res.end(JSON.stringify({ success: false, message: '用户名或密码错误' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end('登录失败');
          }
        });
      });

      // 验证 Token API
      server.middlewares.use('/api/verify', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { token } = JSON.parse(body);
            const isValid = validTokens.has(token);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: isValid }));
          } catch (err) {
            res.statusCode = 500;
            res.end('验证失败');
          }
        });
      });

      // 登出 API
      server.middlewares.use('/api/logout', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { token } = JSON.parse(body);
            validTokens.delete(token);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.statusCode = 500;
            res.end('登出失败');
          }
        });
      });

      // 保存文件 API（需要登录）
      server.middlewares.use('/api/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { filename, code, token } = JSON.parse(body);
            
            // 验证登录状态
            if (!token || !validTokens.has(token)) {
              res.statusCode = 401;
              res.end('请先登录');
              return;
            }
            
            if (!filename || !code) {
              res.statusCode = 400;
              res.end('缺少文件名或代码内容');
              return;
            }
            
            // 验证文件扩展名
            const validExtensions = ['.cpp', '.py', '.c', '.h', '.hpp'];
            const ext = path.extname(filename).toLowerCase();
            if (!validExtensions.includes(ext)) {
              res.statusCode = 400;
              res.end('不支持的文件类型');
              return;
            }
            
            // 安全处理文件名
            const safeName = path.basename(filename);
            const filePath = path.join(SAVE_DIR, safeName);
            
            // 写入文件
            fs.writeFileSync(filePath, code, 'utf-8');
            
            console.log(`[DEV] 文件已保存: ${safeName}`);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              message: `文件 "${safeName}" 保存成功`,
              path: filePath 
            }));
          } catch (err: any) {
            console.error('保存文件失败:', err);
            res.statusCode = 500;
            res.end('保存文件失败: ' + err.message);
          }
        });
      });

      // 获取文件列表 API
      server.middlewares.use('/api/files', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          const files = fs.readdirSync(SAVE_DIR).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.cpp', '.py', '.c', '.h', '.hpp'].includes(ext);
          });
          
          const fileList = files.map(file => ({
            name: file,
            size: fs.statSync(path.join(SAVE_DIR, file)).size,
            modified: fs.statSync(path.join(SAVE_DIR, file)).mtime
          }));
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(fileList));
        } catch (err) {
          console.error('获取文件列表失败:', err);
          res.statusCode = 500;
          res.end('获取文件列表失败');
        }
      });

      // 读取单个文件 API
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/api\/file\/(.+)$/);
        if (!match) {
          next();
          return;
        }

        const filename = decodeURIComponent(match[1]);
        const safeName = path.basename(filename);
        const filePath = path.join(SAVE_DIR, safeName);

        if (req.method === 'GET') {
          try {
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404;
              res.end('文件不存在');
              return;
            }
            
            const code = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ name: safeName, code }));
          } catch (err) {
            res.statusCode = 500;
            res.end('读取文件失败');
          }
        } else if (req.method === 'DELETE') {
          // 删除文件需要验证 token（从 header 获取）
          const authHeader = req.headers['authorization'];
          const token = authHeader?.replace('Bearer ', '');
          
          if (!token || !validTokens.has(token)) {
            res.statusCode = 401;
            res.end('请先登录');
            return;
          }

          try {
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404;
              res.end('文件不存在');
              return;
            }
            
            fs.unlinkSync(filePath);
            console.log(`[DEV] 文件已删除: ${safeName}`);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.statusCode = 500;
            res.end('删除文件失败');
          }
        } else {
          res.statusCode = 405;
          res.end('Method not allowed');
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), devServerApi()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
