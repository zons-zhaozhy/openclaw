#!/bin/bash

# ============================================================================
# OpenClaw 开发环境完整启动脚本
# 功能: 更新代码 → 编译打包 → 配置 → 启动服务
# 用法: ./dev-start.sh [选项]
#   --skip-update    跳过 git pull 更新
#   --skip-build     跳过编译
#   --skip-onboard   跳过 onboard 配置
#   --watch          启动后进入 watch 模式（自动重载）
#   --force-stop     强制停止现有 gateway 再启动
#   --help           显示帮助
# ============================================================================

# 不使用 set -e，手动处理错误

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="/Users/stan/code/ai/github/openclaw"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18888}"
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-dddfbbf4fe9ec1ec8a4c7d3b974bd54d}"
LOG_FILE="/tmp/openclaw-start.log"

# 选项标志
SKIP_UPDATE=false
SKIP_BUILD=false
SKIP_ONBOARD=true  # 默认跳过 onboard，避免交互阻塞
WATCH_MODE=false
FORCE_STOP=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-update)
            SKIP_UPDATE=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-onboard)
            SKIP_ONBOARD=true
            shift
            ;;
        --onboard)
            SKIP_ONBOARD=false
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --force-stop)
            FORCE_STOP=true
            shift
            ;;
        --help|-h)
            echo "用法: ./dev-start.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --skip-update    跳过 git pull 更新"
            echo "  --skip-build     跳过编译"
            echo "  --skip-onboard   跳过 onboard 配置 (默认)"
            echo "  --onboard        运行 onboard 配置向导"
            echo "  --watch          启动后进入 watch 模式（自动重载）"
            echo "  --force-stop     强制停止现有 gateway 再启动"
            echo "  --help, -h       显示此帮助"
            echo ""
            echo "示例:"
            echo "  ./dev-start.sh                    # 完整流程 (跳过 onboard)"
            echo "  ./dev-start.sh --skip-update      # 跳过更新，只编译和启动"
            echo "  ./dev-start.sh --onboard          # 完整流程含 onboard 向导"
            echo "  ./dev-start.sh --watch            # 完整流程 + watch 模式"
            echo "  ./dev-start.sh --force-stop       # 强制重启"
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            exit 1
            ;;
    esac
done

# 工具函数
print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}[步骤 $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查 gateway 是否在运行
is_gateway_running() {
    local pid=$(lsof -t -i :$GATEWAY_PORT 2>/dev/null)
    if [ -n "$pid" ]; then
        return 0
    fi
    return 1
}

# 停止 gateway
stop_gateway() {
    print_step "5" "停止现有 Gateway 服务..."

    # 使用 openclaw 自带的停止命令
    if [ -f dist/index.js ]; then
        node dist/index.js gateway stop 2>/dev/null || true
    fi

    # 备用：直接杀掉占用端口的进程
    local pid=$(lsof -t -i :$GATEWAY_PORT 2>/dev/null)
    if [ -n "$pid" ]; then
        kill $pid 2>/dev/null || true
        sleep 1
        # 如果还没停止，强制杀掉
        if lsof -i :$GATEWAY_PORT > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null || true
        fi
    fi

    # 等待端口释放
    local count=0
    while is_gateway_running && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done

    if is_gateway_running; then
        print_warning "无法停止现有 Gateway，尝试继续..."
    else
        print_success "已停止现有服务"
    fi
}

# 安全加载环境变量（处理带空格的值）
load_env_file() {
    local file=$1
    if [ -f "$file" ]; then
        while IFS= read -r line || [ -n "$line" ]; do
            # 跳过注释和空行
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ -z "${line// }" ]] && continue
            # 导出变量
            export "$line" 2>/dev/null || true
        done < "$file"
        return 0
    fi
    return 1
}

# ============================================================================
# 主流程
# ============================================================================

cd "$PROJECT_DIR" || {
    print_error "无法进入目录: $PROJECT_DIR"
    exit 1
}

print_header "🦞 OpenClaw 开发环境启动脚本"

# 检查依赖
print_step "0" "检查依赖..."
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    print_error "Node.js 版本过低 (当前: $(node -v))，需要 >= 22"
    exit 1
fi
print_success "Node.js $(node -v)"

if command -v pnpm &> /dev/null; then
    print_success "pnpm $(pnpm -v)"
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    print_success "npm $(npm -v)"
    PKG_MANAGER="npm"
else
    print_error "未找到 pnpm 或 npm"
    exit 1
fi

# ============================================================================
# 1. 更新代码
# ============================================================================
if [ "$SKIP_UPDATE" = false ]; then
    print_step "1" "更新代码 (git pull)..."

    # 检查是否有未提交的更改
    STASHED=false
    if ! git diff --quiet 2>/dev/null; then
        print_warning "有未提交的更改，暂存中..."
        git stash
        STASHED=true
    fi

    if git pull origin main 2>&1; then
        print_success "代码已更新"
    else
        print_warning "git pull 失败（可能是网络问题），继续执行..."
    fi

    # 恢复暂存的更改
    if [ "$STASHED" = true ]; then
        git stash pop 2>/dev/null || true
        print_success "已恢复暂存的更改"
    fi
else
    print_step "1" "跳过代码更新 (--skip-update)"
fi

# ============================================================================
# 2. 安装/更新依赖
# ============================================================================
print_step "2" "安装/更新依赖..."

if [ "$PKG_MANAGER" = "pnpm" ]; then
    if pnpm install 2>&1; then
        print_success "依赖已更新"
    else
        print_warning "pnpm install 有警告，继续执行..."
    fi
else
    if npm install 2>&1; then
        print_success "依赖已更新"
    else
        print_warning "npm install 有警告，继续执行..."
    fi
fi

# ============================================================================
# 3. 编译打包
# ============================================================================
if [ "$SKIP_BUILD" = false ]; then
    print_step "3" "编译打包..."

    echo "   → 构建 UI..."
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        if pnpm ui:build 2>&1; then
            echo "   ✅ UI 构建完成"
        else
            print_error "UI 构建失败"
            exit 1
        fi
    else
        if npm run ui:build 2>&1; then
            echo "   ✅ UI 构建完成"
        else
            print_error "UI 构建失败"
            exit 1
        fi
    fi

    echo "   → 构建主程序..."
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        if pnpm build 2>&1 | tee "$LOG_FILE"; then
            echo "   ✅ 主程序构建完成"
        else
            print_error "主程序构建失败，查看日志: $LOG_FILE"
            exit 1
        fi
    else
        if npm run build 2>&1 | tee "$LOG_FILE"; then
            echo "   ✅ 主程序构建完成"
        else
            print_error "主程序构建失败，查看日志: $LOG_FILE"
            exit 1
        fi
    fi

    print_success "编译完成"
else
    print_step "3" "跳过编译 (--skip-build)"
fi

# ============================================================================
# 4. 配置 (onboard)
# ============================================================================
if [ "$SKIP_ONBOARD" = false ]; then
    print_step "4" "运行 onboard 配置..."

    # 检查终端是否支持交互
    if [ -t 0 ]; then
        # 交互模式
        if [ "$PKG_MANAGER" = "pnpm" ]; then
            pnpm openclaw onboard
        else
            npm run openclaw onboard
        fi
    else
        # 非交互模式，跳过
        print_warning "非交互终端，跳过 onboard。如需配置请手动运行: pnpm openclaw onboard"
    fi
else
    print_step "4" "跳过 onboard 配置 (默认，使用 --onboard 启用)"
fi

# ============================================================================
# 5. 停止现有服务
# ============================================================================
if [ "$FORCE_STOP" = true ] || is_gateway_running; then
    stop_gateway
else
    print_step "5" "没有检测到运行中的 Gateway"
fi

# ============================================================================
# 6. 加载环境变量
# ============================================================================
print_step "6" "加载环境变量..."

# 加载项目 .env
if load_env_file "$PROJECT_DIR/.env"; then
    print_success "已加载 .env"
fi

# 加载 ~/.openclaw/.env
if load_env_file ~/.openclaw/.env; then
    print_success "已加载 ~/.openclaw/.env"
fi

# 显示关键环境变量（隐藏敏感部分）
ENV_INFO=""
if [ -n "$DEEPSEEK_API_KEY" ]; then
    ENV_INFO+="   DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY:0:10}...\n"
fi
if [ -n "$OPENAI_API_KEY" ]; then
    ENV_INFO+="   OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}...\n"
fi
if [ -n "$ANTHROPIC_API_KEY" ]; then
    ENV_INFO+="   ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:10}...\n"
fi
if [ -n "$ENV_INFO" ]; then
    echo -e "$ENV_INFO"
fi

# ============================================================================
# 7. 启动 Gateway
# ============================================================================
print_step "7" "启动 Gateway..."

# 设置环境变量
export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"

# 再次确认端口未被占用
if is_gateway_running; then
    print_error "端口 $GATEWAY_PORT 仍被占用"
    print_warning "使用 --force-stop 强制停止"
    exit 1
fi

if [ "$WATCH_MODE" = true ]; then
    echo "   → 启动 watch 模式（自动重载）..."
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        exec pnpm gateway:watch --port "$GATEWAY_PORT"
    else
        exec npm run gateway:watch -- --port "$GATEWAY_PORT"
    fi
    # exec 会替换当前进程，下面的代码不会执行
else
    echo "   → 启动标准模式..."

    # 使用 nohup 在后台启动
    nohup node dist/index.js gateway --port "$GATEWAY_PORT" --verbose > "$LOG_FILE" 2>&1 &
    GATEWAY_PID=$!
    echo "   Gateway PID: $GATEWAY_PID"

    # 等待启动
    echo "   等待服务启动..."
    count=0
    while ! is_gateway_running && [ $count -lt 15 ]; do
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    echo ""

    # 检查状态
    if is_gateway_running; then
        print_success "Gateway 在端口 $GATEWAY_PORT 运行"
    else
        print_error "Gateway 启动失败"
        echo "   查看日志: tail -100 $LOG_FILE"
        tail -50 "$LOG_FILE"
        exit 1
    fi
fi

# ============================================================================
# 8. 显示状态
# ============================================================================
print_header "🎉 启动完成"

echo -e "Gateway 状态:"
echo -e "  ${GREEN}●${NC} PID:  $(lsof -t -i :$GATEWAY_PORT 2>/dev/null)"
echo -e "  ${GREEN}●${NC} 端口: $GATEWAY_PORT"
echo -e "  ${GREEN}●${NC} URL:  ${CYAN}http://localhost:$GATEWAY_PORT${NC}"
echo ""
echo -e "认证信息:"
echo -e "  Token: ${YELLOW}$GATEWAY_TOKEN${NC}"
echo ""
echo -e "快捷访问:"
echo -e "  ${CYAN}http://localhost:$GATEWAY_PORT/?token=$GATEWAY_TOKEN${NC}"
echo ""
echo -e "常用命令:"
echo -e "  查看日志:   tail -f ~/.openclaw/logs/gateway.log"
echo -e "  停止服务:   node dist/index.js gateway stop"
echo -e "  快速重启:   ./dev-start.sh --skip-update --skip-build"
echo ""

if [ "$WATCH_MODE" = false ]; then
    echo -e "${GREEN}Gateway 在后台运行中${NC}"
fi
