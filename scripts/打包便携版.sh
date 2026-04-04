#!/bin/bash
# OpenClaw 便携版 - 打包分发脚本

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="OpenClaw-便携版-v${VERSION}"
PORTABLE_DIR="portable/OpenClaw-Portable"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   OpenClaw 便携版 - 打包工具          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查目录
if [ ! -d "$PORTABLE_DIR" ]; then
    echo "❌ 未找到便携版目录"
    exit 1
fi

# 测试
echo -e "${GREEN}[1/4]${NC} 运行可用性测试..."
cd "$PORTABLE_DIR"
if ! ./测试便携版.sh; then
    echo "❌ 测试失败"
    exit 1
fi
cd - > /dev/null

# 准备文件
echo -e "${GREEN}[2/4]${NC} 准备打包文件..."
TMP_DIR="/tmp/$PACKAGE_NAME"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='数据/*' \
  --exclude='.DS_Store' \
  --exclude='start-*.sh' \
  --exclude='start*.bat' \
  --exclude='测试便携版.sh' \
  "$PORTABLE_DIR/" "$TMP_DIR/" | grep -v '/$' || true

# 创建示例数据目录
mkdir -p "$TMP_DIR/数据/config"
mkdir -p "$TMP_DIR/数据/sessions"

# 添加版本信息
cat > "$TMP_DIR/版本信息.txt" << EOF
OpenClaw 便携版
版本: $VERSION
构建时间: $(date '+%Y-%m-%d %H:%M:%S')
系统要求: Node.js 18+

官网: https://openclaw.ai
文档: https://docs.openclaw.ai/zh-CN
社区: https://discord.com/invite/clawd

快速开始：
1. 双击 启动.sh (macOS) 或 启动.bat (Windows)
2. 选择「U盘快速启动」或「安装到电脑」
3. 输入 API Key 开始使用

详细说明请查看「首次使用必读.txt」
EOF

# 打包
echo -e "${GREEN}[3/4]${NC} 创建压缩包..."
cd /tmp
tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
cd - > /dev/null

mv "/tmp/$PACKAGE_NAME.tar.gz" .
rm -rf "$TMP_DIR"

# 完成
echo -e "${GREEN}[4/4]${NC} 打包完成！"
echo ""
echo "📦 文件: $PACKAGE_NAME.tar.gz"
echo "📊 大小: $(du -h "$PACKAGE_NAME.tar.gz" | cut -f1)"
echo ""
echo "分发方式："
echo "  • 上传到百度网盘/阿里云盘/腾讯微云"
echo "  • 通过 QQ/微信发送（如果文件不大）"
echo "  • 上传到 GitHub Releases"
echo ""
echo "用户使用："
echo "  解压: tar -xzf $PACKAGE_NAME.tar.gz"
echo "  进入: cd $PACKAGE_NAME"
echo "  启动: 双击 启动.sh 或 启动.bat"
echo ""
