#!/bin/bash
set -e
USB="/Volumes/openclaw"
if [ ! -d "$USB" ]; then echo "❌ U盘未挂载"; exit 1; fi

VERSION=$(python3 -c "import json;print(json.load(open('package.json'))['version'])")
echo "=== 同步 openclaw v${VERSION} 到 U盘 ==="

# 1. 同步 dist
echo "[1/5] 更新 dist..."
rm -rf "$USB/openclaw/dist"
rsync -a dist/ "$USB/openclaw/dist/"

# 2. 同步完整 node_modules
echo "[2/5] 同步 node_modules..."
rsync -a node_modules/ "$USB/openclaw/node_modules/" \
  --exclude='.cache' \
  --exclude='.DS_Store'

# 3. 同步 package.json（版本号必须一致，否则插件版本检查失败）
echo "[3/5] 同步 package.json..."
cp package.json "$USB/openclaw/package.json"

# 4. 更新启动脚本
echo "[4/5] 更新启动脚本..."
cp portable/OpenClaw-Portable/setup-config.js "$USB/"
cp portable/OpenClaw-Portable/setup-mode.js "$USB/"
cp "portable/OpenClaw-Portable/启动.bat" "$USB/"
cp "portable/OpenClaw-Portable/启动.sh" "$USB/"
cp "portable/OpenClaw-Portable/启动macOS.command" "$USB/"

# 5. 验证
echo "[5/5] 验证..."
echo "  版本: v${VERSION}"
echo "  dist: $(du -sh "$USB/openclaw/dist/" | cut -f1)"
echo "  node_modules: $(du -sh "$USB/openclaw/node_modules/" | cut -f1)"
echo "  package.json: $(python3 -c "import json;print(json.load(open('$USB/openclaw/package.json'))['version'])")"
echo ""
echo "=== DONE ==="
