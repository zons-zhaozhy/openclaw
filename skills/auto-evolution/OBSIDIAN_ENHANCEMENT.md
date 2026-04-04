# Obsidian 完全指南

> 让 Obsidian 更强大、更智能、更好用

## 🎯 Obsidian 能做什么？

### 核心功能

| 功能              | 说明                |
| ----------------- | ------------------- |
| **Markdown 笔记** | 本地存储， 人类可读 |
| **双向链接**      | `[[]]` 语法连接笔记 |
| **知识图谱**      | 可视化笔记关系      |
| **标签系统**      | `#tag` 组织内容     |
| **搜索**          | 全文搜索 + 链接搜索 |
| **多设备同步**    | Git/iCloud/Dropbox  |

### 高级功能

| 功能         | 说明                  |
| ------------ | --------------------- |
| **Canvas**   | 无限画布， 可视化思维 |
| **白板**     | 手写、绘图            |
| **PDF 标注** | 内置 PDF 阅读         |
| **代码块**   | 语法高亮 + 执行       |
| **嵌入**     | 嵌入网页、视频、图片  |

---

## 🚀 必装插件 (2026)

### 1. Dataview ⭐⭐⭐⭐⭐

**功能**: 数据库查询 + 表格视图

```dataview
# 查询所有未完成任务
TASK FROM "Projects" WHERE !completed

# 查询最近修改的笔记
TABLE file.mtime as 修改时间
FROM "Knowledge"
SORT file.mtime DESC
LIMIT 10
```

**安装**: 设置 → 社区插件 → 浏览 → 搜索 "Dataview"

---

### 2. Templater ⭐⭐⭐⭐⭐

**功能**: 动态模板 + JavaScript 执行

```javascript
<%*
// 自动创建日期笔记
let date = tp.date.now("YYYY-MM-DD");
let title = tp.file.title;
tR %>---
date: <% date %>
tags: [daily]
---

# <% title %>

## 今日任务
- [ ]

## 笔记

<%* // 插入模板后自动打开 Dataview 查询 %>
```

**安装**: 设置 → 社区插件 → 浏览 → 搜索 "Templater"

---

### 3. Tasks ⭐⭐⭐⭐⭐

**功能**: 任务管理 + 日期 + 重复

```markdown
- [ ] #task 完成项目报告 📅 2026-03-10
- [ ] #task 每日站会 🔁 every day
- [x] #task 代码审查 ✅ 2026-03-08
```

**查询任务**:

```tasks
not done
due before tomorrow
sort by due
```

---

### 4. Calendar ⭐⭐⭐⭐

**功能**: 日历视图 + 日期笔记

- 侧边栏日历
- 点击日期创建笔记
- 显示每日笔记数量

---

### 5. Periodic Notes ⭐⭐⭐⭐

**功能**: 周期性笔记（日记/周记/月记/年记）

- 自动创建日期笔记
- 模板支持
- 与 Calendar 集成

---

## 🤖 AI 增强插件

### 1. AI Integration Hub

**功能**: 集成 Google Gemini AI

- 生成笔记
- 润色内容
- 智能摘要

### 2. Obsidian AI

**功能**: Claude/GPT 集成

- 对话式问答
- 笔记分析
- 内容生成

### 3. MCP Integration

**功能**: Model Context Protocol

- 连接 Claude Desktop
- AI 读取 Vault
- 双向交互

---

## 🔧 工作流增强

### 1. QuickAdd ⭐⭐⭐⭐

**功能**: 快速捕获 + 宏

```javascript
// 快速添加任务
Macro: Add Task
- Input: 任务内容
- Template: task-template.md
- Action: 追加到 Inbox.md
```

### 2. Advanced Tables ⭐⭐⭐⭐

**功能**: 表格增强

- 自动格式化
- 公式支持
- 排序/筛选

### 3. Excalidraw ⭐⭐⭐⭐

**功能**: 手绘风格图表

- 流程图
- 架构图
- 手写笔记

---

## 📊 知识管理增强

### 1. Graph Analysis

**功能**: 知识图谱分析

- 节点重要性
- 社区发现
- 孤立笔记检测

### 2. Breadcrumbs

**功能**: 层级导航

```
Parent:: [[Projects]]
Sibling:: [[Other Project]]
Child:: [[Subtask]]
```

### 3. Map View

**功能**: 地图视图

- 地理标签
- 位置笔记
- 旅行日志

---

## 🎨 外观增强

### 1. Minimal Theme

**风格**: 简洁现代

### 2. Things Theme

**风格**: Apple Things 风格

### 3. Blue Topaz Theme

**风格**: 精美配色

### 4. Iconize

**功能**: 自定义图标

```markdown
- 📁 项目
- 📝 笔记
- ✅ 任务
- 📅 日程
```

---

## 🚀 一键安装配置

### 安装核心插件

1. 打开 Obsidian
2. 设置 → 社区插件 → 关闭安全模式
3. 浏览社区插件
4. 搜索并安装:

| 插件            | 必要性     |
| --------------- | ---------- |
| Dataview        | ⭐⭐⭐⭐⭐ |
| Templater       | ⭐⭐⭐⭐⭐ |
| Tasks           | ⭐⭐⭐⭐⭐ |
| Calendar        | ⭐⭐⭐⭐   |
| QuickAdd        | ⭐⭐⭐⭐   |
| Advanced Tables | ⭐⭐⭐⭐   |
| Excalidraw      | ⭐⭐⭐⭐   |
| Iconize         | ⭐⭐⭐     |

### 配置 Templater

1. 设置 → Templater
2. 模板文件夹: `templates/`
3. 启用 "Trigger Templater on new file creation"
4. 创建模板:

```
~/Knowledge-Base/templates/
├── daily.md
├── project.md
├── meeting.md
└── task.md
```

---

## 📋 推荐工作流

### 每日工作流

```
1. 打开 Obsidian
2. Cmd/Ctrl + P → "Periodic Notes: Open today"
3. 模板自动填充日期
4. 记录今日任务、笔记
5. Dataview 自动汇总
```

### 项目工作流

```
1. 创建项目笔记: templates/project.md
2. 添加任务: - [ ] #task 任务描述
3. 添加笔记: [[]] 链接相关内容
4. 查看进度: Dataview 查询
```

### 知识积累

```
1. 闪念笔记 → Inbox.md
2. 整理 → 项目文件夹
3. 提炼 → Knowledge/
4. 连接 → [[]] 双向链接
5. 回顾 → Graph View
```

---

## 🔗 与 OpenClaw 集成

### 共享知识库

```bash
# OpenClaw 自动读取
~/.openclaw/workspace/evolution → ~/Knowledge-Base/memory

# 你在 Obsidian 中编辑
~/Knowledge-Base/memory/MEMORY.md

# OpenClaw 自动学习
Heartbeat 时扫描变更
```

### MCP 集成

```bash
# 安装 Obsidian MCP
npm install -g @smithery/mcp-obsidian

# 配置 Claude Desktop
# 编辑 ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "obsidian": {
      "command": "mcp-obsidian",
      "args": ["--vault", "/Users/stan/Knowledge-Base"]
    }
  }
}
```

---

## 📚 资源

| 资源          | 链接                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| 官方插件库    | [obsidian.md/plugins](https://obsidian.md/plugins)                                                          |
| 2026 必装插件 | [Reddit 讨论](https://www.reddit.com/r/ObsidianMD/comments/1r3rhwt/the_musthave_obsidian_plugins_for_2026/) |
| 模板集合      | [GitHub](https://github.com/dmscode/Obsidian-Templates)                                                     |
| AI 集成指南   | [Seotistics](https://seotistics.com/content-management-obsidian-llm/)                                       |

---

## ✅ 快速设置清单

- [ ] 安装核心插件 (Dataview, Templater, Tasks)
- [ ] 安装 Calendar + Periodic Notes
- [ ] 配置模板文件夹
- [ ] 创建第一个模板
- [ ] 设置每日笔记
- [ ] 安装主题
- [ ] 配置同步 (Git/iCloud)
- [ ] 测试 AI 集成 (可选)

---

_Obsidian 增强指南 v1.0.0 | 2026-03-08_

Sources:

- [Obsidian Official Plugins](https://obsidian.md/plugins)
- [2026 Must-Have Plugins](https://www.reddit.com/r/ObsidianMD/comments/1r3rhwt/the_musthave_obsidian_plugins_for_2026/)
- [Obsidian Templates](https://github.com/dmscode/Obsidian-Templates)
- [AI Integration Guide](https://seotistics.com/content-management-obsidian-llm/)
