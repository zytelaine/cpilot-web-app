#!/bin/bash

echo "🚀 开始安装 cPilot Web 应用..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+ 版本"
    echo "📖 安装指南: https://nodejs.org/"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 显示版本信息
echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功！"
else
    echo "❌ 依赖安装失败，请检查网络连接或重试"
    exit 1
fi

# 创建环境配置文件
echo "⚙️  创建环境配置文件..."
if [ ! -f .env ]; then
    cat > .env << EOF
# cPilot Web 应用环境配置
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=cPilot Web
VITE_APP_DESCRIPTION=基于CAMEL框架的先进多智能体协作系统
EOF
    echo "✅ 环境配置文件创建成功"
else
    echo "ℹ️  环境配置文件已存在"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 使用说明："
echo "  启动开发服务器: npm run dev"
echo "  构建生产版本: npm run build"
echo "  预览生产版本: npm run preview"
echo ""
echo "🌐 开发服务器将在 http://localhost:3000 启动"
echo ""
echo "📚 更多信息请查看 README.md 文件" 