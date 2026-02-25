#!/bin/bash
# EasyMultiProfiler Web - 环境修复脚本
# 解决常见的依赖和启动问题

echo "🔧 EasyMultiProfiler 环境修复脚本"
echo "=================================="
echo ""

# 检测当前目录
if [ -f "backend/app.py" ] && [ -d "frontend" ]; then
    PROJECT_ROOT="."
elif [ -f "app.py" ]; then
    PROJECT_ROOT=".."
else
    echo "❌ 错误: 请在项目根目录或 backend 目录运行此脚本"
    exit 1
fi

echo "📍 项目路径: $(cd $PROJECT_ROOT && pwd)"
echo ""

# 修复后端
if command -v python3 &> /dev/null || command -v python &> /dev/null; then
    echo "🐍 修复 Python 环境..."
    
    cd "$PROJECT_ROOT/backend"
    
    # 安装/修复依赖
    pip install -r requirements.txt --upgrade
    
    if [ $? -eq 0 ]; then
        echo "✅ Python 依赖安装完成"
    else
        echo "⚠️ Python 依赖安装出现问题，尝试使用 --force-reinstall"
        pip install -r requirements.txt --force-reinstall
    fi
    
    cd "$PROJECT_ROOT"
else
    echo "⚠️ 未找到 Python，跳过后端修复"
fi

echo ""

# 修复前端
if command -v npm &> /dev/null; then
    echo "📦 修复 Node.js 环境..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # 清理旧的依赖
    if [ -d "node_modules" ]; then
        echo "🗑️  清理旧的 node_modules..."
        rm -rf node_modules package-lock.json
    fi
    
    # 重新安装
    echo "📥 重新安装 npm 依赖..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Node.js 依赖安装完成"
    else
        echo "❌ npm 安装失败，请检查网络连接"
    fi
    
    cd "$PROJECT_ROOT"
else
    echo "⚠️ 未找到 npm，跳过前端修复"
fi

echo ""
echo "=================================="
echo "✨ 修复完成!"
echo ""
echo "启动命令:"
echo "  后端: cd backend && python app.py"
echo "  前端: cd frontend && npm start"
echo ""
