## Docker 部署（前端 + 后端）

### 1. 准备环境变量

在运行 docker compose 前设置 Piston Key（后端使用）：

```bash
export PISTON_API_KEY='Bearer YOUR_KEY'
```

### 2. 构建并启动

```bash
docker compose up --build
```

### 3. 访问

浏览器打开：

- http://localhost:8080/

### 4. 停止

```bash
docker compose down
```
