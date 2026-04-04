#!/bin/bash
# OpenClaw 便携版 - Mac/Linux 智能启动脚本
# 自动识别系统平台，一键启动或安装

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

clear
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          OpenClaw 便携版 v2026.2.9              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ========== 1. 自动识别系统平台 ==========
OS=$(uname -s)
ARCH=$(uname -m)

case "$OS-$ARCH" in
    Darwin-arm64)   PLATFORM="darwin-arm64"; PLATFORM_NAME="macOS (Apple Silicon)" ;;
    Darwin-x86_64)  PLATFORM="darwin-x64";   PLATFORM_NAME="macOS (Intel)" ;;
    Linux-x86_64)   PLATFORM="linux-x64";    PLATFORM_NAME="Linux (x64)" ;;
    Linux-aarch64)  PLATFORM="linux-arm64";   PLATFORM_NAME="Linux (ARM64)" ;;
    *)              PLATFORM="unknown";       PLATFORM_NAME="未知 ($OS $ARCH)" ;;
esac

echo -e "${GREEN}系统识别:${NC} $PLATFORM_NAME → $PLATFORM"
echo ""

# ========== 1.5 macOS: 解除 Gatekeeper 隔离 ==========
if [ "$OS" = "Darwin" ]; then
    # 移除 quarantine 标记，防止 Gatekeeper 拦截
    xattr -cr "$SCRIPT_DIR/runtime" 2>/dev/null || true
    xattr -cr "$SCRIPT_DIR/openclaw" 2>/dev/null || true
fi

# ========== 2. 查找 Node.js ==========
NODE_BIN=""
PORTABLE_NODE="$SCRIPT_DIR/runtime/node/$PLATFORM/bin/node"

# 优先用便携版自带的 Node
if [ -x "$PORTABLE_NODE" ]; then
    NODE_BIN="$PORTABLE_NODE"
    echo -e "${GREEN}✓${NC} 使用便携版 Node.js ($($NODE_BIN -v))"
# 备选：系统 Node
elif command -v node &> /dev/null; then
    NODE_BIN="node"
    echo -e "${YELLOW}✓${NC} 使用系统 Node.js ($(node -v))"
else
    echo -e "${RED}❌ 未找到 Node.js${NC}"
    echo ""
    echo "请访问 https://nodejs.org/ 下载安装，或联系提供者获取完整便携版。"
    read -p "按回车退出..."
    exit 1
fi

# ========== 3. 验证程序文件 ==========
CLI_FILE="$SCRIPT_DIR/openclaw/dist/index.js"
if [ ! -f "$CLI_FILE" ]; then
    echo -e "${RED}❌ 程序文件缺失！${NC}"
    echo "openclaw/dist/ 目录不完整，请联系提供者。"
    read -p "按回车退出..."
    exit 1
fi
echo -e "${GREEN}✓${NC} OpenClaw 程序就绪"

# ========== 4. 选择模式 ==========
echo ""
echo -e "${CYAN}请选择：${NC}"
echo "  1) U盘直接运行（数据存在U盘）"
echo "  2) 安装到本机（推荐长期使用）"
echo ""
read -p "选择 [1-2]: " choice

case $choice in
    1)
        # U盘模式
        export OPENCLAW_STATE_DIR="$SCRIPT_DIR/data"
        mkdir -p "$OPENCLAW_STATE_DIR/config"
        echo ""
        echo -e "${GREEN}→ U盘模式${NC}"
        ;;
    2)
        # 安装到本机
        INSTALL_DIR="$HOME/.openclaw-portable"
        echo ""
        echo -e "${GREEN}→ 安装到:${NC} $INSTALL_DIR"
        echo ""

        # 只复制当前平台需要的 Node 运行时（节省磁盘空间）
        mkdir -p "$INSTALL_DIR"

        echo "  📋 复制程序文件..."
        cp -r "$SCRIPT_DIR/openclaw" "$INSTALL_DIR/" 2>/dev/null || true

        echo "  📋 复制 Node 运行时 ($PLATFORM)..."
        mkdir -p "$INSTALL_DIR/runtime/node/$PLATFORM"
        cp -r "$SCRIPT_DIR/runtime/node/$PLATFORM/"* "$INSTALL_DIR/runtime/node/$PLATFORM/" 2>/dev/null || true

        # 迁移已有数据
        if [ -d "$SCRIPT_DIR/data" ] && [ "$(ls -A "$SCRIPT_DIR/data" 2>/dev/null)" ]; then
            echo "  📋 迁移数据..."
            cp -r "$SCRIPT_DIR/data" "$INSTALL_DIR/" 2>/dev/null || true
        fi

        export OPENCLAW_STATE_DIR="$INSTALL_DIR/data"
        mkdir -p "$OPENCLAW_STATE_DIR/config"

        # 创建 bin/openclaw (全局命令)
        mkdir -p "$INSTALL_DIR/bin"
        cat > "$INSTALL_DIR/bin/openclaw" << CLI_EOF
#!/bin/bash
export OPENCLAW_STATE_DIR="$INSTALL_DIR/data"
export OPENCLAW_GATEWAY_TOKEN=portable
if [ -x "$INSTALL_DIR/runtime/node/$PLATFORM/bin/node" ]; then
    NODE="$INSTALL_DIR/runtime/node/$PLATFORM/bin/node"
else
    NODE="node"
fi
exec \$NODE "$INSTALL_DIR/openclaw/dist/index.js" "\$@"
CLI_EOF
        chmod +x "$INSTALL_DIR/bin/openclaw"

        # 添加到 PATH (写入 shell profile)
        PATH_LINE='export PATH="$HOME/.openclaw-portable/bin:$PATH"'
        if [ "$OS" = "Darwin" ]; then
            SHELL_RC="$HOME/.zshrc"
        else
            SHELL_RC="$HOME/.bashrc"
        fi
        if [ -f "$SHELL_RC" ] && ! grep -q 'openclaw-portable/bin' "$SHELL_RC" 2>/dev/null; then
            echo '' >> "$SHELL_RC"
            echo '# OpenClaw portable' >> "$SHELL_RC"
            echo "$PATH_LINE" >> "$SHELL_RC"
            echo "  ✅ 已添加到 PATH (新终端生效)"
        elif [ ! -f "$SHELL_RC" ]; then
            echo "$PATH_LINE" >> "$SHELL_RC"
            echo "  ✅ 已添加到 PATH"
        else
            echo "  ✅ PATH 已配置"
        fi

        # 创建启动脚本 (gateway 快捷方式)
        cat > "$INSTALL_DIR/start.sh" << START_EOF
#!/bin/bash
cd "$INSTALL_DIR"
exec "$INSTALL_DIR/bin/openclaw" gateway --port 18789 --allow-unconfigured
START_EOF
        chmod +x "$INSTALL_DIR/start.sh"

        # 创建桌面快捷方式 (macOS)
        if [ "$OS" = "Darwin" ]; then
            cat > "$HOME/Desktop/OpenClaw.command" << MAC_EOF
#!/bin/bash
"$INSTALL_DIR/start.sh"
MAC_EOF
            chmod +x "$HOME/Desktop/OpenClaw.command"
            echo "  ✅ 已创建桌面快捷方式"
        fi

        # 创建桌面快捷方式 (Linux)
        if [ "$OS" = "Linux" ]; then
            mkdir -p "$HOME/Desktop" 2>/dev/null
            ln -sf "$INSTALL_DIR/start.sh" "$HOME/Desktop/OpenClaw.sh" 2>/dev/null
            echo "  ✅ 已创建桌面快捷方式"
        fi

        echo ""
        echo -e "${GREEN}✓ 安装完成！${NC}"
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        read -p "按回车退出..."
        exit 1
        ;;
esac

# ========== 5. 首次配置 (via setup-config.js) ==========
export OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR:-$OPENCLAW_DATA_DIR}"
"$NODE_BIN" "$SCRIPT_DIR/setup-config.js"

# ========== 6. 启动 Gateway ==========
PORT=18789
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  启动 OpenClaw Gateway...${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 浏览器访问: ${CYAN}http://localhost:${PORT}${NC}"
echo "  📝 按 Ctrl+C 停止服务"
echo ""

export OPENCLAW_GATEWAY_TOKEN=portable

# 后台启动 gateway，然后自动打开浏览器
"$NODE_BIN" "$CLI_FILE" gateway --port $PORT &
GATEWAY_PID=$!

# 等待 gateway 就绪后自动打开浏览器
BROWSER_OPENED=false
for i in $(seq 1 15); do
    if curl -s "http://localhost:${PORT}/health" > /dev/null 2>&1; then
        if [ "$BROWSER_OPENED" = "false" ]; then
            BROWSER_OPENED="true"
            echo -e "${GREEN}✓ Gateway 已就绪，正在打开浏览器...${NC}"
            if [ "$OS" = "Darwin" ]; then
                open "http://localhost:${PORT}" 2>/dev/null || true
            elif [ "$OS" = "Linux" ]; then
                xdg-open "http://localhost:${PORT}" 2>/dev/null || sensible-browser "http://localhost:${PORT}" 2>/dev/null || true
            fi
        fi
        break
    fi
    sleep 1
done

if [ "$BROWSER_OPENED" = "false" ]; then
    echo -e "${YELLOW}提示: 浏览器未自动打开，请手动访问 http://localhost:${PORT}${NC}"
fi

# 等待 gateway 进程
wait $GATEWAY_PID
