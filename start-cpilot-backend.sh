#!/bin/bash

# 启动 cPilot_v1 后端服务脚本

echo "🚀 启动 cPilot_v1 后端服务..."

# 检查是否在正确的目录
if [ ! -d "../cPilot_v1" ]; then
    echo "❌ 错误: 找不到 ../cPilot_v1 目录"
    echo "请确保此脚本在 cpilot-web-app 目录中运行"
    exit 1
fi

# 切换到 cPilot_v1 目录
cd ../cPilot_v1

# 检查 Python 环境
echo "🐍 检查 Python 环境..."

# 尝试使用 conda 环境
if command -v conda &> /dev/null; then
    echo "✅ 找到 conda，尝试使用 conda 环境..."
    
    # 检查是否存在 cpilot 环境
    if conda env list | grep -q "cpilot"; then
        echo "🔄 激活现有 cpilot 环境..."
        conda activate cpilot
    else
        echo "📦 创建新的 cpilot 环境 (Python 3.11)..."
        conda create -n cpilot python=3.11 -y
        conda activate cpilot
    fi
    
    PYTHON_CMD="python"
elif command -v python3.11 &> /dev/null; then
    echo "✅ 找到 Python 3.11，使用系统版本..."
    PYTHON_CMD="python3.11"
elif command -v python3.10 &> /dev/null; then
    echo "✅ 找到 Python 3.10，使用系统版本..."
    PYTHON_CMD="python3.10"
elif command -v python3.9 &> /dev/null; then
    echo "✅ 找到 Python 3.9，使用系统版本..."
    PYTHON_CMD="python3.9"
elif command -v python3 &> /dev/null; then
    echo "⚠️  警告: 找到 Python 3，但版本可能不兼容..."
    PYTHON_CMD="python3"
else
    echo "❌ 错误: 找不到兼容的 Python 版本"
    echo "cPilot_v1 需要 Python 3.8-3.11"
    echo "建议使用 conda 创建 Python 3.11 环境"
    exit 1
fi

echo "🔍 当前 Python 版本:"
$PYTHON_CMD --version

# 检查虚拟环境
if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
    echo "⚠️  警告: 找不到虚拟环境，尝试创建..."
    $PYTHON_CMD -m venv .venv
fi

# 激活虚拟环境
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# 升级 pip
echo "📦 升级 pip..."
pip install --upgrade pip

# 安装依赖
echo "📦 安装依赖..."
pip install -r requirements.txt

# 检查关键依赖
echo "🔍 检查关键依赖..."
if ! python -c "import openai" 2>/dev/null; then
    echo "⚠️  缺少 openai 模块，尝试安装..."
    pip install openai
fi

# 检查 .env 文件
if [ ! -f "cPilot/.env" ]; then
    echo "⚠️  警告: 找不到 .env 文件，从模板创建..."
    cp cPilot/.env_template cPilot/.env
    echo "📝 请编辑 cPilot/.env 文件，配置你的 API 密钥"
    echo "   特别是 QWEN_API_KEY 用于 qwen max 模型"
fi

# 启动 webapp 服务
echo "🌐 启动 webapp 服务..."
cd cPilot
python webapp.py

echo "✅ cPilot_v1 后端服务已启动"
echo "📱 前端应用可以连接到 http://localhost:7860" 