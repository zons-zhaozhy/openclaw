#!/bin/bash
# OpenClaw 便携版 - 分发打包（优化版）

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

VERSION=$(node -p "require('./package.json').version")
PORTABLE_DIR="portable/OpenClaw-Portable"
DIST_NAME="OpenClaw-便携版-v${VERSION}"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   OpenClaw 便携版 - 分发打包          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查目录
if [ ! -d "$PORTABLE_DIR" ]; then
    echo "❌ 未找到便携版目录"
    exit 1
fi

# 测试
echo -e "${GREEN}[1/3]${NC} 运行测试..."
cd "$PORTABLE_DIR"
if ! ./测试便携版.sh; then
    echo "❌ 测试失败"
    exit 1
fi
cd - > /dev/null

# 清理不必要的文件
echo -e "${GREEN}[2/3]${NC} 准备分发文件..."
cd "$PORTABLE_DIR"

# 删除开发用文件
rm -f 测试便携版.sh start-*.sh start*.bat 2>/dev/null || true

# 创建版本信息
cat > "版本信息.txt" << EOF
OpenClaw 便携版
版本: $VERSION
构建: $(date '+%Y-%m-%d %H:%M:%S')
要求: Node.js 18+

👉 双击「启动.sh」开始使用
EOF

cd - > /dev/null

# 创建 ZIP（通用）
echo -e "${GREEN}[3/3]${NC} 创建分发包..."
cd portable
zip -r "../$DIST_NAME.zip" "OpenClaw-Portable" \
  -x "*.DS_Store" \
  -x "*/数据/*" \
  -x "*/node_modules/*" \
  -x "*.log"
cd - > /dev/null

# 显示结果
echo ""
echo "✅ 打包完成！"
echo ""
echo "📦 分发包: $DIST_NAME.zip"
echo "📊 大小: $(du -h "$DIST_NAME.zip" | cut -f1)"
echo ""
echo "分发建议："
echo ""
echo "  ✅ 推荐 - 直接分发文件夹"
echo "     复制整个 OpenClaw-Portable 到 U 盘"
echo "     用户双击启动即可"
echo ""
echo "  📦 备选 - 分发 ZIP 压缩包"
echo "     上传到网盘或 GitHub Releases"
echo "     用户下载后双击解压（macOS/Windows 自带解压）"
echo ""
echo "用户使用流程："
echo "  1. 下载 OpenClaw-便携版文件夹或 ZIP"
echo "  2. 如果是 ZIP，双击解压"
echo "  3. 双击「启动.sh」或「启动.bat」"
echo "  4. 按提示配置 AI，开始使用"
echo ""
