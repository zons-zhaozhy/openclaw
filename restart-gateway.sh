#!/bin/bash

echo "=== OpenClaw Gateway 重启脚本 ==="

# 1. 停止当前 Gateway
echo "1. 停止当前 Gateway..."
pkill -f gateway 2>/dev/null
sleep 2

# 2. 加载环境变量（包含 DeepSeek API Key）
echo "2. 加载环境变量..."
source ~/.zshrc

# 3. 重新启动 Gateway
echo "3. 启动 Gateway..."
openclaw gateway --port 18888 &
sleep 3

# 4. 检查状态
echo "4. 检查状态..."
lsof -i :18888 && echo "✅ Gateway 在 18888 端口运行" || echo "❌ 启动失败"

# 5. 显示 token
echo ""
echo "5. Gateway Token（用于控制台认证）:"
echo "   Token: dddfbbf4fe9ec1ec8a4c7d3b974bd54d"
echo ""
echo "   在 http://localhost:18888 控制台设置中输入此 token"
echo ""
echo "   或直接访问："
echo "   http://localhost:18888/?token=dddfbbf4fe9ec1ec8a4c7d3b974bd54d"
