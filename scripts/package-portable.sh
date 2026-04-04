#!/bin/bash
# OpenClaw 便携版 - 打包脚本
# 用于创建可分发的压缩包

set -e

# 颜色
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

PORTABLE_DIR="portable/OpenClaw-Portable"
VERSION=$(node -p "require('./package.json').version")
OUTPUT_NAME="OpenClaw-Portable-${VERSION}"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   OpenClaw 便携版 - 打包工具          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查目录是否存在
if [ ! -d "$PORTABLE_DIR" ]; then
    echo "❌ 未找到便携版目录: $PORTABLE_DIR"
    exit 1
fi

# 运行测试
echo -e "${GREEN}[1/4]${NC} 运行可用性测试..."
cd "$PORTABLE_DIR"
if ! ./测试便携版.sh; then
    echo ""
    echo "❌ 测试失败，请先修复问题"
    exit 1
fi
cd - > /dev/null

# 创建临时目录
echo -e "${GREEN}[2/4]${NC} 准备打包文件..."
TMP_DIR="/tmp/$OUTPUT_NAME"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

# 复制文件（排除不必要的文件）
rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='数据/*' \
  --exclude='.DS_Store' \
  "$PORTABLE_DIR/" "$TMP_DIR/"

# 创建空的示例数据目录
mkdir -p "$TMP_DIR/数据/config"
mkdir -p "$TMP_DIR/数据/sessions"

# 添加版本信息
cat > "$TMP_DIR/版本信息.txt" << EOF
OpenClaw 便携版
版本: $VERSION
构建时间: $(date '+%Y-%m-%d %H:%M:%S')
系统要求: Node.js 18+

官网: https://openclaw.ai
文档: https://docs.openclaw.ai
社区: https://discord.com/invite/clawd
EOF

# 打包
echo -e "${GREEN}[3/4]${NC} 创建压缩包..."
cd /tmp
tar -czf "$OUTPUT_NAME.tar.gz" "$OUTPUT_NAME"
cd - > /dev/null

# 移动到项目目录
mv "/tmp/$OUTPUT_NAME.tar.gz" .
rm -rf "$TMP_DIR"

# 显示结果
echo -e "${GREEN}[4/4]${NC} 打包完成！"
echo ""
echo "📦 压缩包: $OUTPUT_NAME.tar.gz"
echo "📊 大小: $(du -h "$OUTPUT_NAME.tar.gz" | cut -f1)"
echo ""
echo "分发方法："
echo "  1. 上传到云盘（Google Drive / 百度网盘等）"
echo "  2. 复制到 U 盘直接使用"
echo "  3. 发送邮件（如果文件不大）"
echo ""
echo "用户使用："
echo "  tar -xzf $OUTPUT_NAME.tar.gz"
echo "  cd $OUTPUT_NAME"
echo "  ./启动.sh"
echo ""
