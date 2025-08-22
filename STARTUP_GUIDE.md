# 🚀 cPilot Web App 完整启动指南

## 📋 系统架构

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│  cpilot-web-app │ ◄────────────► │   cPilot_v1     │
│   (端口:3000)   │                │   (端口:7860)   │
└─────────────────┘                └─────────────────┘
```

## ⚡ 快速启动步骤

### 步骤 1: 启动后端服务

```bash
# 在 cpilot-web-app 目录中
./start-cpilot-fixed.sh
```

**这个脚本会：**
- ✅ 自动创建 Python 3.11 的 conda 环境
- ✅ 安装所有必需的依赖包
- ✅ 配置环境变量
- ✅ 启动 cPilot_v1 后端服务

### 步骤 2: 配置 API 密钥

当后端启动后，会提示你配置 API 密钥：

```bash
# 编辑 .env 文件
nano ../cPilot_v1/cPilot/.env

# 添加你的 Qwen API 密钥
QWEN_API_KEY="your-api-key-here"
```

### 步骤 3: 启动前端应用

在新的终端窗口中：

```bash
# 在 cpilot-web-app 目录中
npm run dev
```

前端将在 `http://localhost:3000` 启动。

## 🔧 手动启动方式

### 方式 A: 使用 conda 环境

```bash
# 1. 激活 conda 环境
conda activate cpilot

# 2. 启动后端
cd ../cPilot_v1/cPilot
python webapp.py

# 3. 新终端启动前端
cd cpilot-web-app
npm run dev
```

### 方式 B: 使用虚拟环境

```bash
# 1. 创建虚拟环境
cd ../cPilot_v1
python3.11 -m venv .venv
source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt
pip install colorama openai gradio

# 3. 启动后端
cd cPilot
python webapp.py

# 4. 新终端启动前端
cd cpilot-web-app
npm run dev
```

## 📱 访问地址

- **前端界面**: http://localhost:3000
- **后端 API**: http://localhost:7860
- **Gradio 界面**: http://localhost:7860 (如果启动成功)

## 🧪 测试连接

### 1. 检查后端状态

```bash
# 检查端口是否被占用
lsof -i :7860

# 测试 API 连接
curl http://localhost:7860/
```

### 2. 测试前端

1. 打开浏览器访问 http://localhost:3000
2. 在聊天界面输入消息
3. 检查是否收到 AI 回复

### 3. 使用测试脚本

```bash
# 安装依赖
npm install node-fetch

# 运行测试
node test-integration.js
```

## 🐛 常见问题解决

### 问题 1: conda 环境激活失败

```bash
# 初始化 conda
conda init bash
source ~/.bashrc

# 重新运行启动脚本
./start-cpilot-fixed.sh
```

### 问题 2: 依赖安装失败

```bash
# 激活环境后手动安装
conda activate cpilot
pip install --upgrade pip
pip install colorama openai gradio
pip install -r requirements.txt
```

### 问题 3: 端口被占用

```bash
# 查看端口占用
lsof -i :7860
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
```

### 问题 4: API 密钥错误

1. 检查 `.env` 文件中的 `QWEN_API_KEY`
2. 验证 API 密钥是否有效
3. 检查账户余额

## 📊 服务状态检查

### 后端状态

```bash
# 查看日志
cd ../cPilot_v1/cPilot/logs
tail -f gradio_log_*.txt

# 检查进程
ps aux | grep webapp.py
```

### 前端状态

```bash
# 检查端口
lsof -i :3000

# 查看构建状态
npm run build
```

## 🔄 重启服务

### 重启后端

```bash
# 停止服务: Ctrl+C
# 重新启动
./start-cpilot-fixed.sh
```

### 重启前端

```bash
# 停止服务: Ctrl+C
# 重新启动
npm run dev
```

## 📚 配置文件说明

### 前端配置 (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    port: 3000,                    // 前端端口
    proxy: {
      '/api': {
        target: 'http://localhost:7860',  // 后端代理
        changeOrigin: true,
      },
    },
  },
});
```

### 后端配置 (.env)

```bash
# Qwen API 配置
QWEN_API_KEY="your-api-key"
QWEN_API_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

# 服务配置
GRADIO_SERVER_PORT=7860
```

## 🎯 成功标志

当你看到以下信息时，说明服务启动成功：

### 后端成功标志

```
✅ cPilot_v1 后端服务已启动
📱 前端应用可以连接到 http://localhost:3000
🔗 后端 API 地址: http://localhost:7860
```

### 前端成功标志

```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**: 检查后端和前端日志
2. **运行诊断**: `./check-environment.sh`
3. **参考文档**: `TROUBLESHOOTING.md`
4. **检查网络**: 确保端口未被占用

---

**🎉 现在你可以开始使用 cPilot Web App 了！**

- 前端: http://localhost:3000
- 后端: http://localhost:7860
- 开始与 qwen max 模型对话吧！ 