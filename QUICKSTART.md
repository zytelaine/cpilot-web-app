# 🚀 cPilot Web App 快速启动指南

## 📋 前置要求

- Node.js 18+ 
- Python 3.8+
- 阿里云 Qwen API 密钥

## ⚡ 快速启动

### 1. 启动后端服务

```bash
# 在 cpilot-web-app 目录中
./start-cpilot-backend.sh
```

**或者手动启动：**

```bash
cd ../cPilot_v1/cPilot
python webapp.py
```

后端服务将在 `http://localhost:7860` 启动。

### 2. 配置前端环境

```bash
# 复制环境配置
cp config.env.example .env

# 编辑 .env 文件（可选，默认使用 localhost:7860）
VITE_CPILOT_API_URL=http://localhost:7860
```

### 3. 启动前端应用

```bash
# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 `http://localhost:5173` 启动。

## 🔧 配置说明

### 后端配置

在 `cPilot_v1/cPilot/.env` 文件中配置：

```bash
# 必需：Qwen API 密钥
QWEN_API_KEY="your-api-key-here"

# 可选：自定义 API 地址
QWEN_API_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
```

### 前端配置

在 `cpilot-web-app/.env` 文件中配置：

```bash
# 后端服务地址
VITE_CPILOT_API_URL=http://localhost:7860
```

## 🧪 测试集成

### 使用测试脚本

```bash
# 安装 node-fetch（如果使用 Node.js 测试）
npm install node-fetch

# 运行测试
node test-integration.js
```

### 手动测试

1. 打开浏览器访问 `http://localhost:5173`
2. 在聊天界面输入消息
3. 检查是否收到 AI 回复

## 📱 使用说明

### 基本功能

- **对话**: 与 qwen max 模型进行自然语言对话
- **工具使用**: 支持文档处理、搜索、代码执行等工具
- **多轮对话**: 保持上下文记忆的连续对话

### 高级功能

- **模块选择**: 选择不同的任务处理模块
- **工具链**: 自动选择合适的工具完成任务
- **结果展示**: 格式化的结果展示和导出

## 🐛 故障排除

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 后端连接失败 | 检查端口 7860 是否被占用 |
| API 密钥错误 | 验证 QWEN_API_KEY 是否正确 |
| 模型加载失败 | 检查网络连接和 API 余额 |
| 前端白屏 | 检查控制台错误和网络请求 |

### 日志查看

```bash
# 后端日志
cd cPilot_v1/cPilot/logs
tail -f gradio_log_*.txt

# 前端日志
# 在浏览器开发者工具中查看
```

## 🔄 更新和维护

### 更新依赖

```bash
# 前端依赖
npm update

# 后端依赖
cd ../cPilot_v1
pip install -r requirements.txt --upgrade
```

### 重启服务

```bash
# 停止服务：Ctrl+C
# 重新启动：重复启动步骤
```

## 📚 更多资源

- [完整集成指南](./CPILOT_INTEGRATION.md)
- [功能说明](./FEATURES.md)
- [cPilot_v1 文档](../cPilot_v1/README.md)
- [CAMEL-AI 框架文档](https://docs.camel-ai.org/)

## 🆘 获取帮助

- 查看日志文件
- 检查网络连接
- 验证配置参数
- 提交 Issue 到项目仓库

---

**🎉 恭喜！你的 cPilot Web App 已经成功启动并集成了 qwen max 模型！** 