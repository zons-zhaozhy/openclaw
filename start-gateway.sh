#!/bin/bash

echo "=== OpenClaw Gateway 启动脚本 ==="

# 1. 加载环境变量（包含 DeepSeek API Key）
echo "1. 加载环境变量..."
source ~/.zshrc

# 2. 检查环境变量
echo "2. 检查环境变量..."
echo "   DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY:0:20}..."
echo "   OPENAI_BASE_URL: $OPENAI_BASE_URL"

# 3. 停止所有现有的 Gateway
echo "3. 停止现有 Gateway..."
pkill -f gateway 2>/dev/null
sleep 2

# 4. 启动 Gateway
echo "4. 启动 Gateway..."
openclaw gateway --port 18888 &

# 5. 等待启动
sleep 5

# 6. 检查状态
echo "5. 检查状态..."
lsof -i :18888 && echo "✅ Gateway 在 18888 端口运行" || echo "❌ 启动失败"

# 7. 显示 Token
echo ""
echo "6. Gateway Token（用于控制台认证）:"
echo "   Token: dddfbbf4fe9ec1ec8a4c7d3b974bd54d"
echo ""
echo "   在 http://localhost:18888 控制台设置中输入此 token"
echo ""
echo "   或直接访问："
echo "   http://localhost:18888/?token=dddfbbf4fe9ec1ec8a4c7d3b974bd54d"
