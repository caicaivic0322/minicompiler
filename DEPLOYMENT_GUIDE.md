# Render部署指南 - 极简编译器项目

本指南提供了在Render平台上部署极简编译器项目的详细步骤。

## 前提条件

1. 已经创建了Render账户
2. 已将代码推送到GitHub仓库：`https://github.com/caicaivic0322/minicompiler.git`
3. 项目中已包含必要的部署配置文件
   - `server.js` - Express服务器入口文件
   - `render.yaml` - Render部署配置文件
   - 已更新的`package.json` - 包含必要的依赖和脚本

## 部署步骤

### 方法一：使用render.yaml自动部署（推荐）

1. **访问Render控制台**
   - 登录您的Render账户：https://dashboard.render.com/

2. **导入项目**
   - 在Render控制台页面，点击右上角的 **"New +"** 按钮
   - 选择 **"Blueprint"**
   - 在 **"Connect a Repository"** 部分，找到您的仓库 `caicaivic0322/minicompiler`
   - 点击 **"Connect"**

3. **配置部署**
   - Render会自动识别您仓库中的`render.yaml`文件
   - 确认配置信息无误后，点击 **"Apply"**

4. **等待部署完成**
   - Render将开始构建和部署过程
   - 构建过程可能需要几分钟时间
   - 部署完成后，您将看到一个绿色的"Live"状态
   - 点击分配的URL即可访问您的应用

### 方法二：手动创建Web服务

如果您希望手动配置部署参数，请按照以下步骤操作：

1. **创建新的Web服务**
   - 登录Render控制台
   - 点击右上角的 **"New +"** 按钮
   - 选择 **"Web Service"**

2. **连接GitHub仓库**
   - 在 **"Connect a Repository"** 部分，找到您的仓库 `caicaivic0322/minicompiler`
   - 点击 **"Connect"**

3. **配置Web服务**
   - **Name**: 输入 `minicompiler` 或您喜欢的名称
   - **Region**: 选择离您的用户最近的区域（如`Oregon`）
   - **Branch**: 确保选择 `main`
   - **Environment**: 选择 `Node`

4. **配置构建和启动命令**
   - **Build Command**: 输入 `npm install && npm run build`
   - **Start Command**: 输入 `npm start`

5. **配置环境变量**
   - 点击 **"Advanced"** 按钮
   - 在 **"Environment Variables"** 部分，添加一个新变量：
     - **Key**: `NODE_VERSION`
     - **Value**: `18`

6. **完成创建**
   - 确认所有配置无误后，点击 **"Create Web Service"**

7. **等待部署**
   - Render将开始构建和部署过程
   - 完成后，您可以通过分配的URL访问应用

## 故障排除

### 常见部署问题

1. **构建失败**
   - 检查是否有编译错误
   - 确保所有依赖都在`package.json`中正确声明
   - 查看构建日志以获取详细错误信息

2. **应用无法启动**
   - 确保`server.js`文件存在且没有错误
   - 检查`package.json`中的`start`脚本是否正确设置为`node server.js`
   - 查看应用日志以获取具体错误信息

3. **静态文件无法访问**
   - 确保构建过程成功生成了`dist`目录
   - 检查`server.js`中的静态文件服务配置是否正确

### 查看日志

- 在Render控制台中，选择您的服务
- 点击 **"Logs"** 标签页查看构建和运行日志
- 对于部署失败的情况，日志会提供有用的错误信息

## 其他注意事项

- 每次推送到GitHub仓库的`main`分支时，Render会自动触发新的部署
- 部署完成后，应用将获得一个`onrender.com`域名
- 您可以在Render控制台中配置自定义域名

如果您遇到任何部署问题，请先查看Render的日志，通常会提供问题的具体原因和解决线索。