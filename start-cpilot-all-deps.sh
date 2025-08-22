#!/bin/bash

# 一次性安装所有缺失依赖的 cPilot_v1 启动脚本
echo "🚀 启动一次性安装所有缺失依赖的 cPilot_v1 后端服务..."

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

echo "🔍 当前环境信息:"
echo "Python 版本: $(python --version)"
echo "Conda 环境: $CONDA_DEFAULT_ENV"

# 升级 pip
echo "📦 升级 pip..."
pip install --upgrade pip

# 完全清除所有代理环境变量
echo "🧹 清除所有代理环境变量..."
unset http_proxy
unset https_proxy
unset HTTP_PROXY
unset HTTPS_PROXY
unset all_proxy
unset ALL_PROXY
unset socks_proxy
unset SOCKS_PROXY

# 基于 webapp.py 分析，一次性安装所有缺失的依赖
echo "📦 一次性安装所有缺失的依赖..."

# 1. 基础依赖（从 webapp.py 直接导入）
pip install gradio
pip install python-dotenv
pip install pandas

# 2. 从 utils 模块导入的依赖
pip install chunkr-ai
pip install datasets
pip install huggingface-hub
pip install tree-sitter-python
pip install tree-sitter
pip install rouge-score
pip install rouge

# 3. 从 pilot 模块导入的依赖
pip install requests-oauthlib
pip install sqlalchemy
pip install colorama
pip install openai

# 4. 其他可能需要的依赖
pip install numpy
pip install requests
pip install aiohttp
pip install beautifulsoup4
pip install feedparser
pip install markdownify
pip install readabilipy
pip install protego
pip install html5lib
pip install webencodings
pip install sgmllib3k

# 5. 重新安装 gradio（在清除代理后）
echo "📦 重新安装 gradio..."
pip uninstall gradio -y
pip install gradio==3.50.2

# 检查所有关键依赖
echo "🔍 检查所有关键依赖..."
python -c "import openai; print('✅ openai: OK')" 2>/dev/null || echo "❌ openai: 安装失败"
python -c "import gradio; print('✅ gradio: OK')" 2>/dev/null || echo "❌ gradio: 安装失败"
python -c "import colorama; print('✅ colorama: OK')" 2>/dev/null || echo "❌ colorama: 安装失败"
python -c "import requests_oauthlib; print('✅ requests_oauthlib: OK')" 2>/dev/null || echo "❌ requests_oauthlib: 安装失败"
python -c "import sqlalchemy; print('✅ sqlalchemy: OK')" 2>/dev/null || echo "❌ sqlalchemy: 安装失败"
python -c "import rouge; print('✅ rouge: OK')" 2>/dev/null || echo "❌ rouge: 安装失败"
python -c "import tree_sitter_python; print('✅ tree_sitter_python: OK')" 2>/dev/null || echo "❌ tree_sitter_python: 安装失败"
python -c "import datasets; print('✅ datasets: OK')" 2>/dev/null || echo "❌ datasets: 安装失败"
python -c "import chunkr_ai; print('✅ chunkr_ai: OK')" 2>/dev/null || echo "❌ chunkr_ai: 安装失败"
python -c "import pandas; print('✅ pandas: OK')" 2>/dev/null || echo "❌ pandas: 安装失败"
python -c "import numpy; print('✅ numpy: OK')" 2>/dev/null || echo "❌ numpy: 安装失败"
python -c "import requests; print('✅ requests: OK')" 2>/dev/null || echo "❌ requests: 安装失败"
python -c "import aiohttp; print('✅ aiohttp: OK')" 2>/dev/null || echo "❌ aiohttp: 安装失败"
python -c "import beautifulsoup4; print('✅ beautifulsoup4: OK')" 2>/dev/null || echo "❌ beautifulsoup4: 安装失败"
python -c "import feedparser; print('✅ feedparser: OK')" 2>/dev/null || echo "❌ feedparser: 安装失败"

# 检查并创建 .env 文件
if [ ! -f "cPilot/.env" ]; then
    echo "📝 创建 .env 文件..."
    mkdir -p cPilot
    cat > cPilot/.env << EOF
# Qwen API 配置
QWEN_API_KEY=your-api-key-here

# 其他配置
DEBUG=True
EOF
    echo "⚠️  请在 cPilot/.env 文件中配置你的 Qwen API 密钥"
fi

# 启动 webapp 服务
echo "🌐 启动 webapp 服务..."
cd cPilot

# 在启动前再次检查代理
echo "🔍 启动前环境检查:"
echo "http_proxy: ${http_proxy:-未设置}"
echo "https_proxy: ${https_proxy:-未设置}"
echo "all_proxy: ${all_proxy:-未设置}"

# 启动服务
python webapp.py

echo "✅ cPilot_v1 后端服务已启动"
echo "📱 前端应用可以连接到 http://localhost:3000"
echo "🔗 后端 API 地址: http://localhost:7860" 