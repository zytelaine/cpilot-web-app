# cPilot Web App 与 cPilot_v1 集成指南

## 概述

本指南说明如何将 cpilot-web-app 前端与 cPilot_v1 后端集成，使用 qwen max 模型来提供智能对话服务。

## 架构说明

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│  cpilot-web-app │ ◄────────────► │   cPilot_v1     │
│   (React前端)    │                │   (Python后端)   │
└─────────────────┘                └─────────────────┘
```

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: cPilot_v1 (基于 CAMEL-AI 框架)
- **模型**: 阿里云 Qwen Max 模型
- **通信**: HTTP REST API

## 快速开始

### 1. 配置环境变量

在 `cpilot-web-app` 目录中创建 `.env` 文件：

```bash
# 复制示例配置文件
cp config.env.example .env

# 编辑 .env 文件
VITE_CPILOT_API_URL=http://localhost:7860
```

### 2. 配置 cPilot_v1 后端

在 `cPilot_v1/cPilot` 目录中：

```bash
# 复制环境变量模板
cp .env_template .env

# 编辑 .env 文件，配置 API 密钥
QWEN_API_KEY="your-qwen-api-key"
QWEN_API_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
```

### 3. 启动后端服务

```bash
# 在 cpilot-web-app 目录中运行
./start-cpilot-backend.sh
```

或者手动启动：

```bash
cd ../cPilot_v1/cPilot
python webapp.py
```

### 4. 启动前端应用

```bash
# 在 cpilot-web-app 目录中
npm run dev
```

## 功能特性

### 🤖 智能对话
- 基于 qwen max 模型的自然语言理解
- 多轮对话支持
- 上下文记忆

### 🛠️ 工具集成
- 文档处理
- 网络搜索
- 代码执行
- 图像分析
- 更多工具...

### 🌐 模块化设计
- 支持多种任务模块
- 可扩展的工具包
- 灵活的配置选项

## API 接口

### 发送消息
```typescript
POST /api/chat
{
  "question": "用户问题",
  "module_name": "run_qwen_zh"
}
```

### 响应格式
```typescript
{
  "answer": "AI 回复内容",
  "token_info": "Token 使用信息",
  "status": "执行状态"
}
```

## 配置说明

### 模型配置
- **主模型**: Qwen Max (文本生成)
- **视觉模型**: Qwen VL Max (图像理解)
- **配置参数**: 温度、最大 token 数等

### 工具配置
- 根据任务需求启用/禁用工具
- 支持自定义工具包
- 工具链式调用

## 故障排除

### 常见问题

1. **连接失败**
   - 检查后端服务是否运行
   - 验证端口 7860 是否可用
   - 检查防火墙设置

2. **API 密钥错误**
   - 确认 QWEN_API_KEY 配置正确
   - 检查 API 密钥是否有效
   - 验证账户余额

3. **模型加载失败**
   - 检查网络连接
   - 验证模型名称是否正确
   - 查看后端日志

### 日志查看

```bash
# 查看后端日志
cd cPilot_v1/cPilot/logs
tail -f gradio_log_*.txt
```

## 开发说明

### 添加新模块

1. 在 `cPilot_v1/examples` 中创建新模块
2. 实现 `construct_society` 函数
3. 配置相应的模型和工具
4. 在前端中添加模块选择

### 自定义工具

1. 继承 `BaseToolkit` 类
2. 实现工具逻辑
3. 注册到工具管理器
4. 在模块中集成

## 性能优化

### 模型优化
- 使用流式响应减少延迟
- 配置合适的 token 限制
- 启用模型缓存

### 前端优化
- 实现消息分页
- 添加加载状态指示
- 优化网络请求

## 安全考虑

- API 密钥安全存储
- 请求频率限制
- 输入验证和过滤
- 错误信息脱敏

## 部署说明

### 生产环境
- 使用 HTTPS
- 配置反向代理
- 设置环境变量
- 监控和日志

### Docker 部署
```bash
# 构建镜像
docker build -t cpilot-web-app .

# 运行容器
docker run -p 3000:3000 cpilot-web-app
```

## 技术支持

- 查看 [cPilot_v1 文档](https://github.com/camel-ai/cPilot)
- 参考 [CAMEL-AI 框架](https://docs.camel-ai.org/)
- 提交 Issue 或 Pull Request

## 更新日志

- **v1.0.0**: 初始集成版本
- 支持 qwen max 模型
- 基础对话功能
- 工具集成框架 