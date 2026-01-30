# 极简编译器 (Minicompiler)

![项目logo](https://via.placeholder.com/150x150?text=Minicompiler)

一个功能强大的基于Web的在线代码编译器，提供C++和Python代码的编辑、编译和执行功能，为开发者提供便捷的在线编程体验。

## 🌟 项目概述

极简编译器是一个现代化的Web应用，旨在为开发者提供一个轻量级但功能完备的在线编程环境。无论是学习编程、快速测试代码片段，还是分享算法实现，极简编译器都能满足您的需求。

### 主要亮点

- **全栈解决方案**：前端通过React构建，后端通过Express提供服务支持
- **无缝体验**：本地执行Python代码，远程安全编译C++代码
- **专业编辑**：基于VS Code核心的Monaco编辑器提供卓越的编码体验
- **部署简便**：支持Render平台一键部署，适合个人和团队使用

## 🚀 功能特点

### 核心功能
- **多语言支持**：内置支持C++和Python代码的编译与执行
- **现代化编辑器**：集成Monaco编辑器，提供语法高亮、自动补全、代码折叠等高级编辑功能
- **实时控制台输出**：即时显示代码执行结果、错误信息和警告
- **文件标签管理**：支持多文件编辑，可在不同代码文件间切换
- **响应式设计**：完美适配桌面、平板和移动设备，提供一致的用户体验

### 技术优势
- **本地执行**：Python代码通过Pyodide在浏览器中直接执行，确保数据隐私和快速响应
- **远程编译**：C++代码通过安全的远程API服务进行编译执行
- **WebAssembly加速**：利用WebAssembly技术提升性能密集型任务的执行效率
- **模块化架构**：清晰的代码组织结构，便于维护和扩展

## 🛠 技术栈

### 前端技术
- **核心框架**：React 19 + TypeScript
- **构建工具**：Vite 6
- **代码编辑器**：Monaco Editor (VS Code的编辑器核心)
- **UI组件**：自定义组件 + Lucide React图标
- **样式处理**：原生CSS (可扩展为CSS Modules或styled-components)
- **状态管理**：React Hooks (可根据需要集成Redux或Context API)

### 后端技术
- **服务器**：Express.js 4
- **运行时**：Node.js 18+
- **静态资源服务**：Express静态文件中间件
- **路由处理**：Express路由系统，支持SPA应用路由

### 代码执行技术
- **Python执行**：Pyodide (WebAssembly版本的Python)
- **C++编译**：WebAssembly和Clang编译器工具链
- **文件系统**：虚拟文件系统实现，支持多文件操作

## 📦 本地开发

### 环境要求
- Node.js (v16或更高版本)
- npm 或 yarn
- 现代Web浏览器 (Chrome, Firefox, Safari, Edge最新版本)

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/caicaivic0322/minicompiler.git
   cd minicompiler
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量** (可选)
   创建`.env`文件，根据需要配置以下环境变量：
   ```
   # Gemini API密钥，用于代码智能补全和错误提示
   GEMINI_API_KEY=your_api_key_here
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **在浏览器中访问**
   打开 http://localhost:3000 或 http://localhost:3001 (取决于配置)

### 构建和预览

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 启动生产服务器
npm start
```

## 🔧 项目结构

```
├── App.tsx             # 主应用组件
├── components/         # UI组件目录
│   ├── Console.tsx     # 控制台输出组件
│   ├── Editor.tsx      # 代码编辑器组件
│   ├── Header.tsx      # 页面头部组件
│   └── TabBar.tsx      # 标签栏组件
├── constants.ts        # 常量定义
├── public/             # 静态资源
│   ├── libs/           # JavaScript库
│   └── wasm/           # WebAssembly文件
├── server.js           # Express服务器配置
├── services/           # 服务层
│   ├── cppService.ts   # C++编译服务
│   └── pyodideService.ts # Python执行服务
├── types.ts            # TypeScript类型定义
└── vite.config.ts      # Vite构建配置
```

## 📖 使用指南

### 基本操作

1. **选择语言**：在编辑器顶部的标签栏中选择C++或Python语言
2. **编写代码**：在主编辑区域输入您的代码
3. **执行代码**：点击运行按钮或使用快捷键执行代码
4. **查看结果**：在控制台区域查看代码执行结果和输出

### 编辑器快捷键

- **Ctrl/Cmd + Enter**：执行当前代码
- **Ctrl/Cmd + S**：保存当前代码
- **Ctrl/Cmd + Z**：撤销操作
- **Ctrl/Cmd + Shift + Z**：重做操作
- **Ctrl/Cmd + F**：查找
- **Ctrl/Cmd + G**：跳转到行

## 🚀 部署说明

### Render平台部署

极简编译器支持在Render平台上轻松部署。项目包含完整的部署配置文件：

1. **自动部署**：使用项目中的`render.yaml`配置文件
   - 登录Render控制台
   - 点击"New +" > "Blueprint"
   - 连接您的GitHub仓库
   - 确认配置并点击"Apply"

2. **手动部署**：在Render控制台创建Web服务
   - 选择Node环境
   - 构建命令：`npm install && npm run build`
   - 启动命令：`npm start`
   - Node版本：18

详细的部署步骤请参考项目中的[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)文件。

### 其他平台部署

极简编译器可以部署在任何支持Node.js的平台上：

1. **Vercel**：支持一键导入GitHub仓库部署
2. **Netlify**：通过配置文件支持构建和部署
3. **AWS/Azure/GCP**：通过容器或直接部署Node.js应用

## 🔒 安全注意事项

- **代码执行安全**：Python代码在浏览器沙箱中执行，C++代码通过安全的远程API编译
- **数据隐私**：您的代码不会被持久化存储（除非您自行保存）
- **资源限制**：为防止资源滥用，代码执行设有时间和内存限制

## 🤝 贡献指南

欢迎对项目进行贡献！如果您想参与开发，请遵循以下步骤：

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 📜 许可证

本项目采用MIT许可证。详情请查看[LICENSE](LICENSE)文件。

## 📧 联系我们

如果您有任何问题、建议或反馈，请随时联系我们：

- 项目仓库：https://github.com/caicaivic0322/minicompiler
- 问题提交：https://github.com/caicaivic0322/minicompiler/issues

---

**极简编译器 - 让编程更简单**

*最后更新时间：2024年11月*
