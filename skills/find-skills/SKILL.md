---
name: find-skills
description: 元能力技能 - 让AI能够自动搜索、发现和安装OpenClaw技能。这是最重要的"第一技能"，装了它，AI就能学会其他任何技能。
metadata:
  {
    "openclaw":
      {
        "emoji": "🔍",
        "always": true,
        "requires": { "bins": ["node", "npm"] },
        "install":
          [
            {
              "id": "clawhub",
              "kind": "node",
              "package": "clawhub",
              "bins": ["clawhub"],
              "label": "Install ClawHub CLI (npm)",
            },
          ],
      },
  }
---

# Find-Skills - 技能发现元能力

## 概述

这是 OpenClaw 最重要的技能——**学会找技能的能力**。

> "不装 find-skills，OpenClaw 永远是个'空壳'；装了 find-skills，它就能自己学、自己长、自己进化。"

## 为什么需要这个技能？

OpenClaw 的能力来自技能，但：

- ClawHub 上有成千上万个技能
- 用户不知道装哪个、怎么装、装了能干啥
- **痛点：能力很强，但不知道能干啥**

find-skills 解决这个问题：当用户提出需求时，AI 自动搜索、推荐、安装相关技能。

## 使用方式

### 工作流程

```
用户需求 → 提取关键词 → 搜索ClawHub → 排序推荐 → 确认安装 → 使用新技能
```

### 具体命令

**1. 搜索技能**

```bash
# 按关键词搜索
clawhub search "中文文档摘要"
clawhub search "react performance"
clawhub search "database backup"

# 限制结果数量
clawhub search "calendar" --limit 3
```

**2. 列出本地技能**

```bash
# 查看所有已安装技能
openclaw skills list

# 只显示可用的技能
openclaw skills list --eligible

# 显示详细信息
openclaw skills list --verbose
```

**3. 查看技能详情**

```bash
openclaw skills info <skill-name>
```

**4. 安装技能**

```bash
# 安装指定技能
clawhub install <skill-slug>

# 安装特定版本
clawhub install <skill-slug> --version 1.2.3

# 强制覆盖安装
clawhub install <skill-slug> --force
```

**5. 检查技能状态**

```bash
openclaw skills check
```

## AI 使用指南

当用户提出新需求时，按以下流程：

### 步骤1：提取搜索关键词

从用户需求中提取核心关键词（支持中英文）

```
用户: "帮我做中文文档摘要"
→ 关键词: ["中文", "摘要", "文档", "summary", "chinese"]

用户: "优化React性能"
→ 关键词: ["react", "performance", "优化", "optimize"]
```

### 步骤2：搜索技能

```bash
clawhub search "<关键词>"
```

### 步骤3：分析结果

按以下优先级排序：

1. **装机量** - 用的人多说明更可靠
2. **评分** - 高评分说明质量好
3. **中文支持** - 中文用户优先

### 步骤4：推荐展示

```
找到 3 个相关技能：

1. 📦 doc-summarizer-zh (推荐)
   装机量: 20,000+ | 评分: 4.8/5
   描述: 中文文档摘要工具，支持多种格式
   中文支持: ✅

2. 📦 chinese-nlp
   装机量: 15,000+ | 评分: 4.6/5
   描述: 中文NLP工具包
   中文支持: ✅

3. 📦 summary-pro
   装机量: 5,000+ | 评分: 4.2/5
   描述: 通用文本摘要
   中文支持: ⚠️ 部分

推荐：doc-summarizer-zh（最热门、评分最高、完全支持中文）
是否安装？(y/n)
```

### 步骤5：安装并使用

```bash
# 用户确认后
clawhub install doc-summarizer-zh

# 安装成功后
# 重新启动会话或继续使用新技能
```

## 最佳实践

### 1. 关键词策略

- **中英文结合**：`"中文 文档摘要 chinese summary"`
- **核心概念**：提取最关键的功能词
- **场景化搜索**：`"postgres backup automation"`

### 2. 评估标准

| 因素       | 权重   | 说明              |
| ---------- | ------ | ----------------- |
| 装机量     | ⭐⭐⭐ | 用的人多 = 更可靠 |
| 评分       | ⭐⭐⭐ | 高评分 = 质量好   |
| 中文支持   | ⭐⭐   | 对中文用户很重要  |
| 更新频率   | ⭐     | 活跃维护更好      |
| 依赖复杂度 | ⭐     | 依赖少更容易安装  |

### 3. 安装前检查

```bash
# 查看技能详情
openclaw skills info <skill-name>

# 检查依赖要求
# 看是否有 bins/env/config 要求
```

## 技能组合建议

安装核心技能组合，打造全能AI：

### 开发者工具包

```bash
clawhub install github       # Git/GitHub操作
clawhub install coding-agent # 代码助手
clawhub install tmux         # 终端复用
```

### 生产力工具包

```bash
clawhub install summarize     # 文本摘要
clawhub install obsidian      # 知识管理
clawhub install notion        # Notion集成
```

### 中文用户包

```bash
# 搜索中文相关技能
clawhub search "中文"
clawhub search "chinese"
clawhub search "zh"
```

## 能力进化路径

**第1周**：安装 find-skills，尝试各种搜索
**第2周**：建立核心技能库（10-20个常用技能）
**第1月**：通过 find-skills 安装 50+ 技能
**第3月**：AI 已成为该领域的"专家"

## 故障排除

### clawhub 命令不存在

```bash
# 安装 ClawHub CLI
npm install -g clawhub
# 或
npx clawhub <命令>
```

### 搜索无结果

- 尝试英文关键词
- 使用更通用的术语
- 查看技能列表：`openclaw skills list`

### 安装失败

```bash
# 检查技能状态
openclaw skills check

# 查看详细错误
clawhub install <skill> --verbose
```

## 相关命令

```bash
# 列出所有技能
openclaw skills list

# 检查技能状态
openclaw skills check

# 查看技能详情
openclaw skills info <skill-name>

# 更新所有技能
clawhub update --all

# 发布技能（开发者）
clawhub publish ./my-skill --slug my-skill
```

## 参考链接

- ClawHub: https://clawhub.com
- OpenClaw 文档: https://docs.openclaw.ai
