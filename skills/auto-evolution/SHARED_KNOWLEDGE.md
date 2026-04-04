# Shared Knowledge Base

> 让 OpenClaw、Claude Code 和你共享同一个知识库

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Knowledge Base                       │
│                  ~/.knowledge-base/                           │
│                                                              │
│  ├── memory/                  # 长期记忆 (共享)               │
│  │   ├── MEMORY.md            # 核心知识                    │
│  │   ├── PATTERNS.md          # 模式库                      │
│  │   ├── SOLUTIONS.md         # 解决方案                    │
│  │   └── daily/               # 每日笔记                    │
│  │                                                              │
│  ├── skills/                  # 技能定义 (共享)               │
│  │   └── *.md                  # 技能文件                    │
│  │                                                              │
│  ├── projects/                # 项目知识                     │
│  │   ├── openclaw/             # OpenClaw 项目               │
│  │   └── [other]/              # 其他项目                    │
│  │                                                              │
│  └── sync/                     # 同步状态                     │
│      └── .git/                 # Git 仓库 (可选)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ OpenClaw│         │Claude   │         │   你    │
   │         │         │  Code   │         │         │
   └─────────┘         └─────────┘         └─────────┘
```

---

## 方案 1: 符号链接 (推荐)

最简单直接的方式， 让所有工具访问同一个目录。

### 设置步骤

```bash
# 1. 创建共享知识库
mkdir -p ~/.knowledge-base/{memory,skills,projects,sync}
mkdir -p ~/.knowledge-base/memory/daily

# 2. 创建核心文件
touch ~/.knowledge-base/memory/{MEMORY,PATTERNS,SOLUTIONS,LESSONS_LEARNED}.md

# 3. 链接到 OpenClaw
ln -sf ~/.knowledge-base/memory ~/.openclaw/workspace/evolution
ln -sf ~/.knowledge-base/skills ~/.openclaw/workspace/skills

# 4. 链接到 Claude Code
ln -sf ~/.knowledge-base/memory ~/.claude/memory
ln -sf ~/.knowledge-base/skills ~/.claude/skills

# 5. 验证
ls -la ~/.openclaw/workspace/evolution
ls -la ~/.claude/memory
```

### 优点

- ✅ 实时同步
- ✅ 简单直接
- ✅ 无需额外工具

### 缺点

- ⚠️ 需要手动管理链接

---

## 方案 2: Git 仓库同步

使用 Git 仓库作为知识库， 支持版本控制和多设备同步。

### 设置步骤

```bash
# 1. 创建知识库仓库
mkdir -p ~/.knowledge-base
cd ~/.knowledge-base
git init

# 2. 创建目录结构
mkdir -p {memory,skills,projects,sync}
mkdir -p memory/daily

# 3. 创建 .gitignore
cat > .gitignore << 'EOF'
# 敏感信息
*.secret.md
*.private.md
.env
*_local.*

# 临时文件
*.tmp
*.bak
*~

# 同步状态
sync/
EOF

# 4. 初始提交
git add .
git commit -m "Initial knowledge base"

# 5. (可选) 添加远程仓库
git remote add origin git@github.com:yourname/knowledge-base.git
git push -u origin main
```

### 同步脚本

```bash
#!/bin/bash
# ~/.knowledge-base/sync.sh

KB_DIR="$HOME/.knowledge-base"
cd "$KB_DIR"

# 拉取最新
git pull --rebase

# 提交本地变更
git add -A
git diff --quiet && git diff --staged --quiet || \
  git commit -m "Auto sync: $(date '+%Y-%m-%d %H:%M')"

# 推送
git push
```

### 定时同步

```bash
# 添加到 crontab
*/10 * * * * ~/.knowledge-base/sync.sh >/dev/null 2>&1
```

---

## 方案 3: Memos 知识库 (推荐用于笔记)

使用 Memos 作为轻量级知识库。

### 安装 Memos

```bash
# 使用 Docker
docker run -d \
  --name memos \
  --publish 5230:5230 \
  --volume ~/.memos/:/var/opt/memos \
  ghcr.io/usememos/memos:latest

# 或使用技能
claude-code-skill memos-start
```

### 集成配置

在 OpenClaw 配置中添加:

```json5
{
  plugins: {
    slots: {
      // 使用 Memos 作为知识库
      knowledge: "memos",
    },
  },
  memos: {
    url: "http://localhost:5230",
    // 默认标签
    defaultTags: ["knowledge", "openclaw"],
  },
}
```

### 保存知识到 Memos

```bash
# 使用技能
claude-code-skill memos-save "学习到的模式: ..."
claude-code-skill memos-save "解决方案: ..."
```

---

## 推荐配置: 混合方案

结合符号链接和 Git 同步。

### 目录结构

```
~/.knowledge-base/
├── .git/                    # Git 版本控制
├── memory/                  # 共享记忆
│   ├── MEMORY.md            # 链接到各工具
│   ├── PATTERNS.md
│   ├── SOLUTIONS.md
│   ├── LESSONS_LEARNED.md
│   ├── PREFERENCES.md
│   └── daily/
│       └── YYYY-MM-DD.md
├── skills/                  # 共享技能
│   └── *.md
├── projects/                # 项目知识
│   └── [project]/
│       └── *.md
├── sync.sh                  # 同步脚本
└── .gitignore
```

### 符号链接设置

```bash
# OpenClaw
ln -sf ~/.knowledge-base/memory ~/.openclaw/workspace/evolution
ln -sf ~/.knowledge-base/skills ~/.openclaw/workspace/skills

# Claude Code
ln -sf ~/.knowledge-base/memory ~/.claude/memory
ln -sf ~/.knowledge-base/skills ~/.claude/skills

# 项目特定
ln -sf ~/.knowledge-base/projects/openclaw ~/code/ai/github/openclaw/.claude-context.md
```

---

## 共享知识格式

### MEMORY.md 模板

```markdown
# Shared Knowledge Base

> OpenClaw + Claude Code 共享记忆

## 🧠 核心知识

### 用户偏好

- **语言**: 中文/英文
- **风格**: 简洁直接
- **专业**: 程序员

### 编程知识

- **技术栈**: TypeScript, Node.js, React
- **风格**: 简洁、类型安全
- **测试**: 测试驱动

### 工作习惯

- **工作流**: Git flow
- **提交**: 频繁、小步
- **文档**: 必要即可

---

## 📚 模式库

### 代码模式

[从 CODING_PATTERNS.md 引用]

### 工作模式

[从 PATTERNS.md 引用]

---

## ✅ 解决方案库

[从 SOLUTIONS.md 引用]

---

## 📅 最近更新

- 2026-03-08: 初始化共享知识库

---

_此文件由 OpenClaw + Claude Code 共同维护_
```

---

## 自动同步协议

### Heartbeat 集成

在 HEARTBEAT.md 中添加:

```markdown
## 知识库同步

每次心跳时:

1. 检查知识库变更
2. 如果有新知识:
   - 提交到 Git
   - 推送到远程 (如果配置)
3. 更新同步状态
```

### Compaction 集成

在 compaction 时:

```markdown
## 知识固化

压缩前:

1. 将学习成果写入共享知识库
2. 确保符号链接有效
3. 同步到 Git
```

---

## 快速设置

```bash
# 一键设置
mkdir -p ~/.knowledge-base/{memory/daily,skills,projects,sync}
touch ~/.knowledge-base/memory/{MEMORY,PATTERNS,SOLUTIONS,LESSONS_LEARNED,PREFERENCES}.md

# 符号链接
ln -sf ~/.knowledge-base/memory ~/.openclaw/workspace/evolution
ln -sf ~/.knowledge-base/memory ~/.claude/memory

# Git 初始化
cd ~/.knowledge-base && git init && git add . && git commit -m "Initial"

# 验证
echo "OpenClaw evolution: $(readlink ~/.openclaw/workspace/evolution)"
echo "Claude Code memory: $(readlink ~/.claude/memory)"
```

---

## 验证共享

```bash
# 测试共享
echo "测试共享知识库" >> ~/.knowledge-base/memory/MEMORY.md

# 验证 OpenClaw 能读取
cat ~/.openclaw/workspace/evolution/MEMORY.md | grep "测试"

# 验证 Claude Code 能读取
cat ~/.claude/memory/MEMORY.md | grep "测试"
```

---

## 注意事项

1. **敏感信息** - 不要放入密码、密钥等
2. **定期同步** - 设置 Git 定时同步
3. **备份** - 定期备份知识库
4. **冲突处理** - Git 可以帮助解决冲突

---

_共享知识库协议 v1.0.0 | 2026-03-08_
