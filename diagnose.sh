#!/bin/bash
# EasyMultiProfiler - 诊断脚本

echo "🔍 EasyMultiProfiler 诊断工具"
echo "=============================="
echo ""

# 检查后端服务
echo "1️⃣ 检查后端服务..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "   ✅ 后端服务正常运行 (端口 5000)"
    curl -s http://localhost:5000/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   版本: {d[\"version\"]}, 状态: {d[\"status\"]}')" 2>/dev/null
else
    echo "   ❌ 后端服务未启动！"
    echo "   💡 启动命令: cd backend && python app.py"
fi
echo ""

# 检查前端
echo "2️⃣ 检查前端服务..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ 前端服务正常运行 (端口 3000)"
else
    echo "   ⚠️ 前端服务未在 3000 端口运行"
    echo "   💡 如果在 5000 端口集成运行，这是正常的"
fi
echo ""

# 检查端口占用
echo "3️⃣ 检查端口占用..."
if lsof -Pi :5000 -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "   ✅ 端口 5000 已被占用"
    lsof -Pi :5000 -sTCP:LISTEN | tail -1 | awk '{print "   进程: " $1 " (PID: " $2 ")"}'
else
    echo "   ❌ 端口 5000 未被占用"
fi
echo ""

# 测试上传 API
echo "4️⃣ 测试上传 API..."
if curl -s -X POST http://localhost:5000/api/upload -H "Content-Type: multipart/form-data" 2>&1 | grep -q "message"; then
    echo "   ✅ 上传 API 可访问"
else
    echo "   ⚠️ 上传 API 可能有问题"
fi
echo ""

# 建议
echo "=============================="
echo "📋 解决方案:"
echo ""
echo "方案 A - 使用集成模式（推荐）:"
echo "   1. 确保后端已构建前端:"
echo "      cd frontend && npm run build"
echo "      cd .. && rm -rf backend/static && cp -r frontend/build backend/static"
echo "   2. 只启动后端:"
echo "      cd backend && python app.py"
echo "   3. 访问: http://localhost:5000"
echo ""
echo "方案 B - 使用开发模式:"
echo "   1. 启动后端: cd backend && python app.py"
echo "   2. 启动前端: cd frontend && npm start"
echo "   3. 访问: http://localhost:3000"
echo ""
echo "=============================="
