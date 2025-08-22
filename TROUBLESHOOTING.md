# 🐛 cPilot Web App 故障排除指南

## 🚨 常见问题及解决方案

### 1. Python 版本兼容性问题

**问题描述**: 
```
ERROR: Ignored the following versions that require a different python version: 
0.1.1 Requires-Python >=3.8.1,<3.12
```

**原因**: cPilot_v1 需要 Python 3.8-3.11，但你的系统使用 Python 3.12+

**解决方案**:

#### 方案 A: 使用 conda 创建兼容环境（推荐）

```bash
# 在 cpilot-web-app 目录中
./start-cpilot-conda.sh
```

#### 方案 B: 手动创建 conda 环境

```bash
cd ../cPilot_v1

# 创建 Python 3.11 环境
conda create -n cpilot python=3.11 -y
conda activate cpilot

# 安装依赖
pip install -r requirements.txt

# 启动服务
cd cPilot
python webapp.py
```

#### 方案 C: 使用 pyenv 管理 Python 版本

```bash
# 安装 Python 3.11
pyenv install 3.11.7
pyenv local 3.11.7

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 缺少依赖模块

**问题描述**:
```
ModuleNotFoundError: No module named 'openai'
```

**解决方案**:

```bash
# 激活正确的 Python 环境后
pip install openai

# 或者安装所有依赖
pip install -r requirements.txt
```

### 3. 端口被占用

**问题描述**: 无法启动服务，端口 7860 被占用

**解决方案**:

```bash
# 查看端口占用
lsof -i :7860

# 杀死占用进程
kill -9 <PID>

# 或者使用其他端口
export GRADIO_SERVER_PORT=7861
```

### 4. API 密钥配置错误

**问题描述**: 服务启动成功但无法调用模型

**解决方案**:

1. 检查 `.env` 文件配置
2. 确保 `QWEN_API_KEY` 正确设置
3. 验证 API 密钥是否有效
4. 检查账户余额

## 🔧 环境检查脚本

### 运行环境检查

```bash
# 在 cpilot-web-app 目录中
./check-environment.sh
```

### 手动检查步骤

```bash
# 1. 检查 Python 版本
python --version

# 2. 检查 conda 环境
conda env list

# 3. 检查关键依赖
python -c "import openai; print('openai: OK')"
python -c "import gradio; print('gradio: OK')"

# 4. 检查网络连接
curl -I https://dashscope.aliyuncs.com
```

## 📋 完整安装流程

### 步骤 1: 环境准备

```bash
# 确保在 cpilot-web-app 目录
cd cpilot-web-app

# 检查 conda 是否可用
conda --version
```

### 步骤 2: 启动后端

```bash
# 使用 conda 脚本（推荐）
./start-cpilot-conda.sh

# 或者使用原始脚本
./start-cpilot-backend.sh
```

### 步骤 3: 配置前端

```bash
# 复制环境配置
cp config.env.example .env

# 编辑配置（如果需要）
nano .env
```

### 步骤 4: 启动前端

```bash
npm run dev
```

## 🧪 测试连接

### 使用测试脚本

```bash
# 安装依赖
npm install node-fetch

# 运行测试
node test-integration.js
```

### 手动测试

1. 打开浏览器访问 `http://localhost:5173`
2. 在聊天界面输入消息
3. 检查是否收到 AI 回复
4. 查看浏览器控制台错误信息

## 📊 日志分析

### 后端日志

```bash
# 查看实时日志
cd ../cPilot_v1/cPilot/logs
tail -f gradio_log_*.txt

# 查看错误日志
grep -i error gradio_log_*.txt
```

### 前端日志

1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页
3. 查看 Network 标签页的网络请求

## 🔄 重置环境

### 完全重置

```bash
# 删除虚拟环境
conda env remove -n cpilot

# 删除缓存
conda clean --all

# 重新创建环境
./start-cpilot-conda.sh
```

### 部分重置

```bash
# 重新安装依赖
conda activate cpilot
pip install --force-reinstall -r requirements.txt
```

## 📞 获取帮助

### 检查清单

- [ ] Python 版本是否兼容 (3.8-3.11)
- [ ] conda 环境是否正确创建
- [ ] 依赖是否完整安装
- [ ] API 密钥是否正确配置
- [ ] 端口是否被占用
- [ ] 网络连接是否正常

### 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|----------|------|----------|
| `ModuleNotFoundError` | 缺少依赖模块 | 安装缺失的包 |
| `Port already in use` | 端口被占用 | 杀死占用进程或更换端口 |
| `API key invalid` | API 密钥无效 | 检查密钥配置 |
| `Connection refused` | 连接被拒绝 | 检查服务是否启动 |

### 联系支持

如果问题仍然存在：

1. 收集完整的错误日志
2. 记录系统环境信息
3. 描述问题发生的具体步骤
4. 提交 Issue 到项目仓库

---

**💡 提示**: 大多数问题都可以通过使用 `./start-cpilot-conda.sh` 脚本解决，它会自动处理环境配置和依赖安装。 