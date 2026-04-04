#!/bin/bash
# OpenClaw 便携版 - 完整准备脚本
# 自动下载所有平台的 Node.js + Ollama + 模型

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PORTABLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$PORTABLE_DIR/runtime"
MODELS_DIR="$PORTABLE_DIR/models"
VERSIONS_DIR="$PORTABLE_DIR/versions"

# 版本配置
NODE_VERSION="22.12.0"
OLLAMA_VERSION="0.5.7"
MODEL_NAME="qwen2.5:3b"

# 下载目录
DOWNLOAD_DIR="$PORTABLE_DIR/.downloads"

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   OpenClaw 便携版 - 完整准备工具          ║${NC}"
echo -e "${CYAN}║   支持全平台: macOS(Intel/ARM) + Windows  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# 创建目录结构
create_directories() {
    echo -e "${GREEN}[1/6]${NC} 创建目录结构..."
    
    # Node.js - 全平台
    mkdir -p "$RUNTIME_DIR/node/mac-arm64"
    mkdir -p "$RUNTIME_DIR/node/mac-x64"
    mkdir -p "$RUNTIME_DIR/node/win-x64"
    mkdir -p "$RUNTIME_DIR/node/linux-x64"
    
    # Ollama - 全平台
    mkdir -p "$RUNTIME_DIR/ollama/mac-arm64"
    mkdir -p "$RUNTIME_DIR/ollama/mac-x64"
    mkdir -p "$RUNTIME_DIR/ollama/windows"
    mkdir -p "$RUNTIME_DIR/ollama/linux"
    
    # 模型
    mkdir -p "$MODELS_DIR/ollama/manifests"
    mkdir -p "$MODELS_DIR/ollama/blobs"
    
    # OpenClaw 版本
    mkdir -p "$VERSIONS_DIR/mac"
    mkdir -p "$VERSIONS_DIR/windows"
    mkdir -p "$VERSIONS_DIR/linux"
    mkdir -p "$VERSIONS_DIR/wsl"
    
    # 数据目录
    mkdir -p "$PORTABLE_DIR/data/config"
    mkdir -p "$PORTABLE_DIR/data/sessions"
    
    # 下载目录
    mkdir -p "$DOWNLOAD_DIR"
    
    echo "   ✓ 目录结构已创建"
    echo ""
}

# 下载 Node.js - 全平台
download_node() {
    echo -e "${GREEN}[2/6]${NC} 下载 Node.js v${NODE_VERSION} (全平台)..."
    echo ""
    
    local node_urls=(
        "mac-arm64|https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-arm64.tar.gz"
        "mac-x64|https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-x64.tar.gz"
        "win-x64|https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
        "linux-x64|https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz"
    )
    
    for item in "${node_urls[@]}"; do
        IFS='|' read -r platform url <<< "$item"
        local filename=$(basename "$url")
        local filepath="$DOWNLOAD_DIR/$filename"
        
        echo -e "   ${CYAN}→${NC} Node.js $platform"
        
        if [[ -f "$filepath" ]]; then
            echo "      已下载，跳过"
        else
            echo "      下载中..."
            curl -L "$url" -o "$filepath" --progress-bar || {
                echo -e "      ${RED}下载失败${NC}"
                continue
            }
        fi
        
        # 解压
        echo "      解压中..."
        local target_dir="$RUNTIME_DIR/node/$platform"
        
        if [[ "$filename" == *.tar.gz ]]; then
            tar -xzf "$filepath" -C "$DOWNLOAD_DIR"
            local extracted_dir=$(find "$DOWNLOAD_DIR" -maxdepth 1 -type d -name "node-v${NODE_VERSION}-*" | head -1)
            if [[ -n "$extracted_dir" ]]; then
                cp "$extracted_dir/bin/node" "$target_dir/" 2>/dev/null || \
                cp "$extracted_dir/node.exe" "$target_dir/" 2>/dev/null || true
                rm -rf "$extracted_dir"
            fi
        elif [[ "$filename" == *.zip ]]; then
            unzip -q "$filepath" -d "$DOWNLOAD_DIR"
            local extracted_dir=$(find "$DOWNLOAD_DIR" -maxdepth 1 -type d -name "node-v${NODE_VERSION}-*" | head -1)
            if [[ -n "$extracted_dir" ]]; then
                cp "$extracted_dir/node.exe" "$target_dir/" 2>/dev/null || true
                rm -rf "$extracted_dir"
            fi
        fi
        
        echo -e "      ${GREEN}✓ 完成${NC}"
    done
    
    echo ""
}

# 下载 Ollama - 全平台
download_ollama() {
    echo -e "${GREEN}[3/6]${NC} 下载 Ollama v${OLLAMA_VERSION} (全平台)..."
    echo ""
    
    # macOS ARM64
    echo -e "   ${CYAN}→${NC} Ollama macOS ARM64"
    curl -L "https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-darwin" \
        -o "$RUNTIME_DIR/ollama/mac-arm64/ollama" --progress-bar || {
        echo -e "      ${RED}下载失败${NC}"
    }
    chmod +x "$RUNTIME_DIR/ollama/mac-arm64/ollama" 2>/dev/null
    echo -e "      ${GREEN}✓ 完成${NC}"
    
    # macOS x64
    echo -e "   ${CYAN}→${NC} Ollama macOS Intel"
    curl -L "https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-darwin-amd64" \
        -o "$RUNTIME_DIR/ollama/mac-x64/ollama" --progress-bar || {
        echo -e "      ${RED}下载失败${NC}"
    }
    chmod +x "$RUNTIME_DIR/ollama/mac-x64/ollama" 2>/dev/null
    echo -e "      ${GREEN}✓ 完成${NC}"
    
    # Windows
    echo -e "   ${CYAN}→${NC} Ollama Windows"
    local win_zip="$DOWNLOAD_DIR/ollama-windows.zip"
    curl -L "https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-windows-amd64.zip" \
        -o "$win_zip" --progress-bar || {
        echo -e "      ${RED}下载失败${NC}"
    }
    if [[ -f "$win_zip" ]]; then
        unzip -q -o "$win_zip" -d "$RUNTIME_DIR/ollama/windows/" 2>/dev/null
        echo -e "      ${GREEN}✓ 完成${NC}"
    fi
    
    # Linux
    echo -e "   ${CYAN}→${NC} Ollama Linux"
    curl -L "https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-linux-amd64" \
        -o "$RUNTIME_DIR/ollama/linux/ollama" --progress-bar || {
        echo -e "      ${RED}下载失败${NC}"
    }
    chmod +x "$RUNTIME_DIR/ollama/linux/ollama" 2>/dev/null
    echo -e "      ${GREEN}✓ 完成${NC}"
    
    echo ""
}

# 复制模型文件
copy_models() {
    echo -e "${GREEN}[4/6]${NC} 复制 Qwen 模型文件..."
    echo "   模型: $MODEL_NAME"
    echo ""
    
    local src_models="$HOME/.ollama/models"
    
    if [[ ! -d "$src_models" ]]; then
        echo -e "   ${RED}❌ 未找到本地 Ollama 模型目录${NC}"
        echo ""
        echo "   请先安装 Ollama 并下载模型:"
        echo "      ollama pull $MODEL_NAME"
        echo ""
        return 1
    fi
    
    # 查找模型 manifest
    local manifest_src="$src_models/manifests/registry.ollama.ai/library"
    local manifest_dst="$MODELS_DIR/ollama/manifests/registry.ollama.ai/library"
    
    mkdir -p "$manifest_dst"
    
    # 查找 qwen2.5 目录
    if [[ -d "$manifest_src/qwen2.5" ]]; then
        echo "   复制模型清单..."
        cp -r "$manifest_src/qwen2.5" "$manifest_dst/"
        
        # 读取需要的 blob 文件
        local model_manifest="$manifest_dst/qwen2.5/3b"
        if [[ -f "$model_manifest" ]]; then
            echo "   分析模型依赖..."
            local blobs=$(grep -o 'sha256:[a-f0-9]*' "$model_manifest" 2>/dev/null | sort -u)
            
            mkdir -p "$MODELS_DIR/ollama/blobs"
            
            local count=0
            local total=$(echo "$blobs" | wc -l)
            
            for blob in $blobs; do
                count=$((count + 1))
                local blob_file="$src_models/blobs/$blob"
                
                if [[ -f "$blob_file" ]]; then
                    local size=$(du -h "$blob_file" | cut -f1)
                    echo "   [$count/$total] 复制 $blob ($size)"
                    cp "$blob_file" "$MODELS_DIR/ollama/blobs/"
                fi
            done
            
            echo -e "   ${GREEN}✓ 模型文件已复制${NC}"
        fi
    else
        echo -e "   ${YELLOW}⚠️  未找到 qwen2.5 模型${NC}"
        echo "   可用模型:"
        ls -1 "$manifest_src" 2>/dev/null | head -10
        echo ""
        echo "   请先下载模型: ollama pull $MODEL_NAME"
    fi
    
    echo ""
}

# 复制 OpenClaw
copy_openclaw() {
    echo -e "${GREEN}[5/6]${NC} 准备 OpenClaw..."
    echo ""
    
    local repo_root="$(cd "$PORTABLE_DIR/../.." && pwd)"
    local found=0
    
    # macOS 版本
    if [[ -d "$repo_root/dist/OpenClaw.app" ]]; then
        echo "   复制 macOS 版本..."
        cp -r "$repo_root/dist/OpenClaw.app" "$VERSIONS_DIR/mac/"
        echo -e "   ${GREEN}✓ macOS 版本已复制${NC}"
        found=1
    else
        echo -e "   ${YELLOW}⚠️  未找到 macOS 版本${NC}"
        echo "      从 GitHub Releases 下载:"
        echo "      https://github.com/openclaw/openclaw/releases"
        echo "      放入: versions/mac/OpenClaw.app"
    fi
    
    # Windows 版本（暂无）
    if [[ ! -f "$VERSIONS_DIR/windows/openclaw.exe" ]]; then
        echo ""
        echo -e "   ${YELLOW}⚠️  Windows 原生版本暂未发布${NC}"
        echo "      将使用 WSL2 方案"
    fi
    
    echo ""
}

# 创建启动器
create_launchers() {
    echo -e "${GREEN}[6/6]${NC} 创建启动脚本..."
    
    # 设置权限
    chmod +x "$PORTABLE_DIR/start.sh" 2>/dev/null
    chmod +x "$PORTABLE_DIR/start-gui.sh" 2>/dev/null
    chmod +x "$PORTABLE_DIR/prepare-usb.sh" 2>/dev/null
    chmod +x "$RUNTIME_DIR/ollama/mac-arm64/ollama" 2>/dev/null
    chmod +x "$RUNTIME_DIR/ollama/mac-x64/ollama" 2>/dev/null
    chmod +x "$RUNTIME_DIR/ollama/linux/ollama" 2>/dev/null
    chmod +x "$RUNTIME_DIR/node/mac-arm64/node" 2>/dev/null
    chmod +x "$RUNTIME_DIR/node/mac-x64/node" 2>/dev/null
    chmod +x "$RUNTIME_DIR/node/linux-x64/node" 2>/dev/null
    
    echo "   ✓ 启动脚本已创建"
    echo ""
}

# 显示总结
show_summary() {
    echo -e "${CYAN}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}✅ 准备完成！${NC}"
    echo ""
    
    echo "📦 目录结构:"
    echo "   runtime/node/"
    echo "     ├── mac-arm64/    macOS Apple Silicon"
    echo "     ├── mac-x64/      macOS Intel"
    echo "     ├── win-x64/      Windows 64位"
    echo "     └── linux-x64/    Linux 64位"
    echo ""
    echo "   runtime/ollama/"
    echo "     ├── mac-arm64/    macOS Apple Silicon"
    echo "     ├── mac-x64/      macOS Intel"
    echo "     ├── windows/      Windows"
    echo "     └── linux/        Linux"
    echo ""
    echo "   models/ollama/      Qwen2.5-3B 模型"
    echo "   versions/           OpenClaw 应用"
    echo ""
    
    # 计算各部分大小
    echo "📊 大小统计:"
    du -sh "$RUNTIME_DIR/node" 2>/dev/null | xargs echo "   Node.js:"
    du -sh "$RUNTIME_DIR/ollama" 2>/dev/null | xargs echo "   Ollama:"
    du -sh "$MODELS_DIR/ollama" 2>/dev/null | xargs echo "   模型:"
    du -sh "$VERSIONS_DIR" 2>/dev/null | xargs echo "   OpenClaw:"
    echo "   ─────────────────"
    du -sh "$PORTABLE_DIR" 2>/dev/null | xargs echo "   总计:"
    
    echo ""
    echo "🚀 下一步:"
    echo ""
    echo "   1. 将 OpenClaw-Portable 整个目录"
    echo "      复制到 U 盘根目录"
    echo ""
    echo "   2. 在目标电脑上:"
    echo "      macOS: 双击 start.sh"
    echo "      Windows: 双击 start.bat"
    echo ""
    echo "   3. 选择运行模式:"
    echo "      • U盘运行 - 直接运行"
    echo "      • 安装到电脑 - 安装到本地"
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════${NC}"
}

# 清理下载缓存
clean_downloads() {
    if [[ -d "$DOWNLOAD_DIR" ]]; then
        echo ""
        read -p "是否清理下载缓存? [Y/n]: " clean
        if [[ ! "$clean" =~ ^[Nn]$ ]]; then
            rm -rf "$DOWNLOAD_DIR"
            echo "   ✓ 下载缓存已清理"
        fi
    fi
}

# 主流程
main() {
    create_directories
    
    echo "准备下载以下组件:"
    echo "  • Node.js v${NODE_VERSION} (macOS ARM/x64, Windows, Linux)"
    echo "  • Ollama v${OLLAMA_VERSION} (macOS ARM/x64, Windows, Linux)"
    echo "  • Qwen2.5-3B 模型 (~2.7GB)"
    echo ""
    
    read -p "开始准备? [Y/n]: " start
    if [[ "$start" =~ ^[Nn]$ ]]; then
        echo "已取消"
        exit 0
    fi
    echo ""
    
    download_node
    download_ollama
    copy_models
    copy_openclaw
    create_launchers
    show_summary
    clean_downloads
}

main
