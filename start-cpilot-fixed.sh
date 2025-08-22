#!/bin/bash

# 修复后的 cPilot_v1 启动脚本

echo "🚀 启动修复后的 cPilot_v1 后端服务..."

# 检查是否在正确的目录
if [ ! -d "../cPilot_v1" ]; then
    echo "❌ 错误: 找不到 ../cPilot_v1 目录"
    echo "请确保此脚本在 cpilot-web-app 目录中运行"
    exit 1
fi

# 检查 conda 是否可用
if ! command -v conda &> /dev/null; then
    echo "❌ 错误: 找不到 conda 命令"
    echo "请先安装 Anaconda 或 Miniconda"
    exit 1
fi

# 初始化 conda（如果需要）
if ! conda info --base &> /dev/null; then
    echo "🔧 初始化 conda..."
    conda init bash
    echo "⚠️  请重新运行此脚本或执行: source ~/.bashrc"
    exit 1
fi

# 切换到 cPilot_v1 目录
cd ../cPilot_v1

# 检查并创建 conda 环境
if conda env list | grep -q "cpilot"; then
    echo "🔄 激活现有 cpilot 环境..."
    eval "$(conda shell.bash hook)"
    conda activate cpilot
else
    echo "📦 创建新的 cpilot 环境 (Python 3.11)..."
    conda create -n cpilot python=3.11 -y
    eval "$(conda shell.bash hook)"
    conda activate cpilot
fi

# 显示当前环境信息
echo "🔍 当前环境信息:"
echo "Python 版本: $(python --version)"
echo "Conda 环境: $CONDA_DEFAULT_ENV"

# 升级 pip
echo "📦 升级 pip..."
pip install --upgrade pip

# 安装基础依赖
echo "📦 安装基础依赖..."
pip install colorama openai gradio

# 安装项目依赖
echo "📦 安装项目依赖..."
pip install -r requirements.txt

# 检查关键依赖
echo "🔍 检查关键依赖..."
python -c "import openai; print('✅ openai: OK')" || echo "❌ openai: 安装失败"
python -c "import gradio; print('✅ gradio: OK')" || echo "❌ gradio: 安装失败"
python -c "import colorama; print('✅ colorama: OK')" || echo "❌ colorama: 安装失败"

# 检查 .env 文件
if [ ! -f "cPilot/.env" ]; then
    echo "⚠️  警告: 找不到 .env 文件，从模板创建..."
    cp cPilot/.env_template cPilot/.env
    echo "📝 请编辑 cPilot/.env 文件，配置你的 API 密钥"
    echo "   特别是 QWEN_API_KEY 用于 qwen max 模型"
    echo ""
    echo "💡 提示: 按 Ctrl+C 停止服务，编辑 .env 文件后重新运行"
    echo ""
fi

# 启动 webapp 服务
echo "🌐 启动 webapp 服务..."
cd cPilot
python webapp.py

echo "✅ cPilot_v1 后端服务已启动"
echo "📱 前端应用可以连接到 http://localhost:3000"
echo "🔗 后端 API 地址: http://localhost:7860" 