# Obsidian + MCP 完整设置指南

## 第一步： 安装 Obsidian

### macOS

```bash
# 方法 1: Homebrew
brew install --cask obsidian

# 方法 2: 手动下载
# 访问 https://obsidian.md/download
# 下载 macOS 版本并安装
```

### Windows

```bash
# 使用 winget
winget install Obsidian.Obsidian

# 或访问 https://obsidian.md/download 下载
```

### Linux

```bash
# 使用 Snap
sudo snap install obsidian

# 或使用 Flatpak
flatpak install flathub md.obsidian.Obsidian
```

---

## 第二步: 创建知识库 Vault

### 创建 Vault 目录

```bash
# 创建专用知识库
mkdir -p ~/Knowledge-Base/{memory,skills,projects,templates}

# 创建子目录
mkdir -p ~/Knowledge-Base/memory/daily
mkdir -p ~/Knowledge-Base/projects/openclaw

# 创建核心文件
touch ~/Knowledge-Base/memory/{MEMORY,PATTERNS,SOLUTIONS,LESSONS_LEARNED,PREFERENCES}.md
touch ~/Knowledge-Base/memory/daily/.gitkeep
```

### 在 Obsidian 中打开 Vault

1. 打开 Obsidian
2. 点击 "Create new vault" 或 "Open folder as vault"
3. 选择 `~/Knowledge-Base` 目录
4. 完成创建

---

## 第三步: 创建知识库结构

### MEMORY.md 模板

```bash
cat > ~/Knowledge-Base/memory/MEMORY.md << 'EOF'
# Shared Knowledge Base

> 人 + OpenClaw + Claude Code 共享记忆

## 👤 用户信息

### 基本信息
- **职业**: 程序员
- **语言**: 中文/英文
- **风格**: 简洁直接

### 技术栈
- **主要语言**: TypeScript/JavaScript
- **框架**: React, Node.js
- **工具**: Git, Docker, pnpm

---

## 🧠 核心知识

### 编程偏好
- 代码风格: 简洁、类型安全
- 测试策略: 测试驱动
- 提交习惯: 频繁、小步

### 工作习惯
- 工作流: Git flow
- 文档风格: 必要即可

---

## 📚 学习记录

### 2026-03-08
- 初始化共享知识库
- 设置 Obsidian + MCP 集成

---

_此文件由人类 + OpenClaw + Claude Code 共同维护_
EOF
```

### PATTERNS.md 模板

````bash
cat > ~/Knowledge-Base/memory/PATTERNS.md << 'EOF'
# Coding Patterns

> 从项目中学习到的代码模式

## 架构模式

### 依赖注入
```typescript
function createDefaultDeps(): Dependencies {
  return {
    logger: createLogger(),
    config: loadConfig(),
  };
}
````

### 配置管理

- 使用 JSON5 格式
- 支持注释和尾随逗号

---

## 代码模式

### 错误处理

- 统一使用 try/catch
- 重新抛出原始异常
- 记录完整堆栈

### 异步操作

- 使用 async/await
- 避免回调地狱

---

_此文件自动学习更新_
EOF

````

---

## 第四步: 安装 MCP 服务器

### 方法 1: 使用 Smithery (推荐)

```bash
# 安装 Smithery CLI
npm install -g @smithery/cli

# 安装 Obsidian MCP
smithery install mcp-obsidian

# 或使用 npx
npx @smithery/cli install mcp-obsidian
````

### 方法 2: 手动配置

```bash
# 创建 MCP 配置目录
mkdir -p ~/.claude

# 创建 MCP 配置文件
cat > ~/.claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "@smithery/mcp-obsidian",
        "/Users/stan/Knowledge-Base"
      ]
    }
  }
}
EOF
```

---

## 第五步: 配置 OpenClaw 集成

### 创建符号链接

```bash
# OpenClaw 链接到知识库
ln -sf ~/Knowledge-Base/memory ~/.openclaw/workspace/evolution
ln -sf ~/Knowledge-Base/skills ~/.openclaw/workspace/skills

# 验证链接
ls -la ~/.openclaw/workspace/
```

### 更新 HEARTBEAT.md

```bash
cat > ~/.openclaw/workspace/HEARTBEAT.md << 'EOF'
# Heartbeat with Shared Knowledge

## 每 30 分钟检查
1. 扫描 ~/Knowledge-Base 中的变更
2. 识别学习机会
3. 更新共享知识库

## 知识同步
- 新模式 → memory/PATTERNS.md
- 解决方案 → memory/SOLUTIONS.md
- 教训 → memory/LESSONS_LEARNED.md

如果只是例行检查，回复 HEARTBEAT_OK
EOF
```

---

## 第六步: 初始化 Git 同步

```bash
cd ~/Knowledge-Base

# 初始化 Git
git init

# 创建 .gitignore
cat > .gitignore << 'EOF'
# Obsidian
.obsidian/

# 敏感信息
*.secret.md
*.private.md

# 临时文件
*.tmp
*.bak
EOF

# 初始提交
git add .
git commit -m "Initial knowledge base"

# (可选) 添加远程仓库
# git remote add origin git@github.com:yourname/knowledge-base.git
# git push -u origin main
```

---

## 第七步: 验证设置

```bash
# 验证目录结构
echo "=== 知识库结构 ==="
ls -la ~/Knowledge-Base/
ls -la ~/Knowledge-Base/memory/

# 验证符号链接
echo ""
echo "=== 符号链接 ==="
readlink ~/.openclaw/workspace/evolution

# 验证 Git
echo ""
echo "=== Git 状态 ==="
cd ~/Knowledge-Base && git status
```

---

## 使用方式

### 人类使用

1. 打开 Obsidian
2. 在 `~/Knowledge-Base` 中创建/编辑笔记
3. 使用双向链接连接知识

### OpenClaw 使用

1. 自动读取 `~/.openclaw/workspace/evolution/` (链接到知识库)
2. Heartbeat 时自动学习
3. 写入新知识到共享文件

### Claude Code 使用

1. 通过 MCP 访问 Obsidian Vault
2. 读取和写入 Markdown 文件
3. 共享同一套知识

---

## 快速设置命令

```bash
# 一键设置 (在安装 Obsidian 后运行)
mkdir -p ~/Knowledge-Base/{memory/daily,skills,projects,templates}
touch ~/Knowledge-Base/memory/{MEMORY,PATTERNS,SOLUTIONS,LESSONS_LEARNED,PREFERENCES}.md
ln -sf ~/Knowledge-Base/memory ~/.openclaw/workspace/evolution
cd ~/Knowledge-Base && git init && git add . && git commit -m "Initial"
echo "✅ 知识库设置完成"
```

---

_设置指南 v1.0.0 | 2026-03-08_
