# Knowledge Base Research Report

> 人 + AI 共享知识库系统深度研究

## 研究目标

找到一款既适合**人类使用**又适合 **AI 使用**的知识库系统。

---

## 候选方案对比

### 1. Obsidian + MCP (推荐 ⭐⭐⭐⭐⭐)

**官网**: [obsidian.md](https://obsidian.md/)

**优点**:

- ✅ **本地 Markdown 文件** - 人类和 AI 都能直接读取
- ✅ **双向链接** - 知识图谱可视化
- ✅ **MCP 生态成熟** - 多个 MCP 服务器可用
- ✅ **插件丰富** - 2000+ 插件
- ✅ **隐私优先** - 完全本地化

**缺点**:

- ⚠️ 需要安装 MCP 服务器
- ⚠️ AI 需要配置才能访问

**MCP 服务器**:

- [mcp-obsidian](https://github.com/smithery-ai/mcp-obsidian) - 官方 MCP 连接器
- [obsidian-mcp-tools](https://forum.obsidian.md/t/claude-mcp-for-obsidian-using-rest-api/93284) - REST API 集成

**适用场景**: 深度知识管理、长期积累

---

### 2. Memos (推荐 ⭐⭐⭐⭐)

**官网**: [usememos.com](https://usememos.com/)

**GitHub**: [usememos/memos](https://github.com/usememos/memos)

**优点**:

- ✅ **轻量级** - 单一二进制文件
- ✅ **Markdown 原生** - 人类和 AI 都能读取
- ✅ **标签系统** - 方便分类和检索
- ✅ **API 完整** - AI 可以通过 API 访问
- ✅ **Docker 部署** - 简单快速

**缺点**:

- ⚠️ 需要运行服务
- ⚠️ 不支持双向链接

**适用场景**: 快速笔记、轻量知识库

---

### 3. Local Memory MCP Server (推荐 ⭐⭐⭐⭐)

**项目**: [Like I Said v2](https://www.reddit.com/r/mcp/comments/1lhpd1o/i_built_a_local_memory_server_for_ai_assistants/)

**优点**:

- ✅ **专为 AI 设计** - 持久化记忆
- ✅ **跨 AI 共享** - Claude/Cursor/GitHub Copilot 都能用
- ✅ **本地优先** - 数据在自己手中
- ✅ **MCP 原生** - 无需额外配置

**缺点**:

- ⚠️ 人类界面较弱
- ⚠️ 不适合深度知识管理

**适用场景**: AI 记忆共享

---

### 4. Logseq

**官网**: [logseq.com](https://logseq.com/)

**优点**:

- ✅ **本地 Markdown** - 人类可读
- ✅ **大纲视图** - 结构化思考
- ✅ **开源免费** - 社区活跃

**缺点**:

- ⚠️ MCP 支持较少
- ⚠️ AI 集成不成熟

**适用场景**: 个人笔记、大纲整理

---

### 5. Notion

**官网**: [notion.so](https://notion.so/)

**优点**:

- ✅ **功能丰富** - 数据库、看板等
- ✅ **协作友好** - 团队使用
- ✅ **AI 功能** - 内置 AI 助手

**缺点**:

- ❌ **闭源** - 数据不在本地
- ❌ **格式复杂** - AI 难以直接读取
- ❌ **需要付费** - 高级功能收费

**适用场景**: 团队协作、项目管理

---

## 推荐方案: Obsidian + MCP

### 为什么推荐 Obsidian?

| 需求     | Obsidian 支持          |
| -------- | ---------------------- |
| 人类可读 | ✅ Markdown 原生文件   |
| AI 可读  | ✅ MCP 服务器集成      |
| 知识图谱 | ✅ 双向链接 + 图谱视图 |
| 本地优先 | ✅ 完全本地化          |
| 隐私控制 | ✅ 数据在自己手中      |
| 长期积累 | ✅ 20年+ 可用性        |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian Vault                             │
│                  ~/Notes/ (or custom)                          │
│                                                              │
│  ├── 📁 Knowledge/              # 知识库                         │
│  │   ├── 📄 MEMORY.md            # 长期记忆                      │
│  │   ├── 📄 PATTERNS.md          # 模式库                        │
│  │   └── 📁 Projects/             # 项目知识                     │
│  │                                                              │
│  ├── 📁 Daily/                   # 每日笔记                       │
│  │   └── 📄 YYYY-MM-DD.md                                        │
│  │                                                              │
│  └── 📁 .obsidian/               # Obsidian 配置                  │
│      └── 📄 plugins/             # 插件 (可选)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Obsidian│         │  MCP    │         │   你    │
   │   App   │◄────────│ Server  │────────►│   编辑   │
   └─────────┘         └─────────┘         └─────────┘
         ▲                    │
         │                    │
         │         ┌─────────┴─────────┐
         │         │                   │
         │         ▼                   ▼
   ┌─────────────┐           ┌─────────────┐
   │   Claude    │           │  OpenClaw   │
   │   Code      │           │             │
   └─────────────┘           └─────────────┘
```

### 设置步骤

```bash
# 1. 安装 Obsidian (如果还没有)
# 下载: https://obsidian.md/download

# 2. 创建/使用现有 Vault
# 假设你的 Vault 在 ~/Notes/

# 3. 安装 MCP 服务器
# Claude Desktop > Settings > Developer > Edit Config

# 添加到 claude_desktop_config.json:
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "@smithery/mcp-obsidian", "/Users/stan/Notes"]
    }
  }
}

# 4. 创建知识库目录
mkdir -p ~/Notes/Knowledge/{Memory,Patterns,Solutions,Projects}
mkdir -p ~/Notes/Daily

# 5. 创建核心文件
touch ~/Notes/Knowledge/Memory/{MEMORY,PATTERNS,SOLUTIONS,LESSONS_LEARNED}.md

# 6. (可选) 链接到 OpenClaw
ln -sf ~/Notes/Knowledge ~/.openclaw/workspace/evolution
```

### 使用方式

**人类使用**:

- 在 Obsidian 中直接编辑 Markdown 文件
- 使用双向链接构建知识图谱
- 使用标签和文件夹组织内容

**AI 使用**:

- Claude Code 通过 MCP 读取/写入文件
- OpenClaw 通过符号链接访问相同文件
- 两者共享同一个知识库

---

## 备选方案: Memos

如果你需要更轻量级的方案:

```bash
# 1. 使用 Docker 启动
docker run -d \
  --name memos \
  --publish 5230:5230 \
  --volume ~/.memos/:/var/opt/memos \
  ghcr.io/usememos/memos:latest

# 2. 访问 Web UI
open http://localhost:5230

# 3. AI 通过 API 访问
curl http://localhost:5230/api/v1/memo
```

**优点**: 更简单、更轻量
**缺点**: 不支持知识图谱、人类界面较弱

---

## 最终推荐

| 场景             | 推荐方案                |
| ---------------- | ----------------------- |
| **深度知识管理** | Obsidian + MCP ⭐       |
| **轻量笔记**     | Memos                   |
| **纯 AI 记忆**   | Local Memory MCP Server |
| **团队协作**     | Notion (但有隐私问题)   |

---

## 下一步行动

1. **如果你已经有 Obsidian**:
   - 安装 MCP 服务器
   - 创建知识库目录结构
   - 开始使用

2. **如果你没有 Obsidian**:
   - 下载 Obsidian
   - 创建 Vault
   - 按"设置步骤"配置

3. **如果你需要轻量方案**:
   - 使用 Memos
   - 配置 API 访问

---

_研究报告 v1.0.0 | 2026-03-08_

Sources:

- [Obsidian Official](https://obsidian.md/)
- [Obsidian AI Plugins](https://obsidian.md/plugins?search=ai)
- [MCP Obsidian Integration](https://github.com/smithery-ai/mcp-obsidian)
- [Memos Official](https://usememos.com/)
- [Memos GitHub](https://github.com/usememos/memos)
- [Local Memory MCP Server](https://www.reddit.com/r/mcp/comments/1lhpd1o/i_built_a_local_memory_server_for_ai_assistants/)
- [Claude Obsidian MCP](https://medium.com/@souvikpal/supercharge-your-knowledge-management-integrating-obsidian-mcp-with-claude-b4269d55db7a)
