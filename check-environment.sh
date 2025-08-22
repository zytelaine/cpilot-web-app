#!/bin/bash

# cPilot 环境检查脚本

echo "🔍 cPilot 环境检查开始..."
echo "================================"

# 检查操作系统
echo "🖥️  操作系统信息:"
echo "  OS: $(uname -s)"
echo "  架构: $(uname -m)"
echo "  内核: $(uname -r)"

# 检查 Python 环境
echo ""
echo "🐍 Python 环境检查:"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo "  ✅ Python3: $PYTHON_VERSION"
    
    # 检查 Python 版本兼容性
    PYTHON_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
    PYTHON_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
    
    if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 8 ] && [ "$PYTHON_MINOR" -le 11 ]; then
        echo "  ✅ Python 版本兼容 (3.8-3.11)"
    else
        echo "  ⚠️  Python 版本可能不兼容 (当前: $PYTHON_MAJOR.$PYTHON_MINOR, 需要: 3.8-3.11)"
    fi
else
    echo "  ❌ Python3 未安装"
fi

# 检查 conda 环境
echo ""
echo "📦 Conda 环境检查:"

if command -v conda &> /dev/null; then
    echo "  ✅ Conda 已安装: $(conda --version)"
    
    # 检查 cpilot 环境
    if conda env list | grep -q "cpilot"; then
        echo "  ✅ cpilot 环境已存在"
        
        # 激活环境并检查
        eval "$(conda shell.bash hook)"
        conda activate cpilot
        
        if [ "$CONDA_DEFAULT_ENV" = "cpilot" ]; then
            echo "  ✅ cpilot 环境已激活"
            echo "  Python 版本: $(python --version)"
        else
            echo "  ⚠️  cpilot 环境激活失败"
        fi
    else
        echo "  ⚠️  cpilot 环境不存在"
    fi
else
    echo "  ❌ Conda 未安装"
fi

# 检查 Node.js 环境
echo ""
echo "🟢 Node.js 环境检查:"

if command -v node &> /dev/null; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js 未安装"
fi

if command -v npm &> /dev/null; then
    echo "  ✅ npm: $(npm --version)"
else
    echo "  ❌ npm 未安装"
fi

# 检查目录结构
echo ""
echo "📁 目录结构检查:"

if [ -d "../cPilot_v1" ]; then
    echo "  ✅ cPilot_v1 目录存在"
    
    if [ -f "../cPilot_v1/cPilot/webapp.py" ]; then
        echo "  ✅ webapp.py 文件存在"
    else
        echo "  ❌ webapp.py 文件不存在"
    fi
    
    if [ -f "../cPilot_v1/requirements.txt" ]; then
        echo "  ✅ requirements.txt 文件存在"
    else
        echo "  ❌ requirements.txt 文件不存在"
    fi
else
    echo "  ❌ cPilot_v1 目录不存在"
fi

# 检查端口占用
echo ""
echo "🔌 端口占用检查:"

if command -v lsof &> /dev/null; then
    if lsof -i :7860 &> /dev/null; then
        echo "  ⚠️  端口 7860 已被占用"
        lsof -i :7860
    else
        echo "  ✅ 端口 7860 可用"
    fi
    
    if lsof -i :5173 &> /dev/null; then
        echo "  ⚠️  端口 5173 已被占用"
        lsof -i :5173
    else
        echo "  ✅ 端口 5173 可用"
    fi
else
    echo "  ⚠️  无法检查端口占用 (lsof 未安装)"
fi

# 检查网络连接
echo ""
echo "🌐 网络连接检查:"

if command -v curl &> /dev/null; then
    if curl -s --connect-timeout 5 https://dashscope.aliyuncs.com &> /dev/null; then
        echo "  ✅ 阿里云 DashScope 连接正常"
    else
        echo "  ❌ 阿里云 DashScope 连接失败"
    fi
else
    echo "  ⚠️  无法检查网络连接 (curl 未安装)"
fi

# 检查环境变量
echo ""
echo "🔧 环境变量检查:"

if [ -f ".env" ]; then
    echo "  ✅ .env 文件存在"
    if grep -q "VITE_CPILOT_API_URL" .env; then
        echo "  ✅ VITE_CPILOT_API_URL 已配置"
    else
        echo "  ⚠️  VITE_CPILOT_API_URL 未配置"
    fi
else
    echo "  ⚠️  .env 文件不存在"
fi

# 总结和建议
echo ""
echo "================================"
echo "📋 检查总结:"

if command -v conda &> /dev/null && conda env list | grep -q "cpilot"; then
    echo "✅ 推荐使用: ./start-cpilot-conda.sh"
elif command -v python3 &> /dev/null; then
    PYTHON_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)" 2>/dev/null || echo "0")
    if [ "$PYTHON_MINOR" -ge 8 ] && [ "$PYTHON_MINOR" -le 11 ]; then
        echo "✅ 推荐使用: ./start-cpilot-backend.sh"
    else
        echo "⚠️  需要创建兼容的 Python 环境"
        echo "   建议: conda create -n cpilot python=3.11"
    fi
else
    echo "❌ 需要安装 Python 3.8-3.11"
fi

echo ""
echo "🔧 下一步操作:"
echo "1. 根据检查结果选择合适的启动脚本"
echo "2. 配置 API 密钥 (QWEN_API_KEY)"
echo "3. 启动后端服务"
echo "4. 启动前端应用"

echo ""
echo "📚 更多帮助:"
echo "- 查看 TROUBLESHOOTING.md 获取详细解决方案"
echo "- 查看 QUICKSTART.md 获取快速启动指南"
echo "- 查看 CPILOT_INTEGRATION.md 获取完整集成说明" 