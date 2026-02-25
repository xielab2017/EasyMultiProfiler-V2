#!/bin/bash
# EasyMultiProfiler - 启动检查脚本

echo "🔍 EasyMultiProfiler 启动检查"
echo "=============================="
echo ""

# 检查后端
echo "🐍 检查后端服务..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ 后端运行正常 (http://localhost:5000)"
else
    echo "❌ 后端未启动"
    echo "   启动命令: cd backend && python app.py"
fi
echo ""

# 检查前端
echo "⚛️  检查前端服务..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端运行正常 (http://localhost:3000)"
else
    echo "⏳ 前端可能正在启动中..."
    echo "   如果持续无响应，请检查 npm start 输出"
fi
echo ""

echo "=============================="
echo "📖 使用说明:"
echo "   前端地址: http://localhost:3000"
echo "   后端地址: http://localhost:5000"
echo ""
echo "🌐 请在浏览器打开: http://localhost:3000"
echo "=============================="
