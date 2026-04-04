# Auto-Evolution Skill

> **让 OpenClaw 持续学习、自我进化、适应变化**

## 触发条件

- 用户说 "进化分析"、"自我改进"、"疯狂学习"
- Heartbeat 检查点（每 6 小时）
- Compaction 前的 Memory Flush
- 检测到重复问题时自动触发

## 核心能力

### 1. 模式捕获 (Pattern Capture)

自动识别并记录：

- 重复出现的问题 → `evolution/PATTERNS.md`
- 成功的解决方案 → `evolution/SOLUTIONS.md`
- 失败尝试 → `evolution/LESSONS_LEARNED.md`
- 用户偏好 → `evolution/PREFERENCES.md`

### 2. 持续扫描 (Continuous Scan)

每 30 分钟扫描：

- 项目依赖更新（npm/pyton）
- 新的技术趋势
- 配置漂移
- 知识缺口

### 2.5 ClawHub 每日修炼 (Daily ClawHub Training)

每天自我修炼时，逛 ClawHub 学习新技能：

```bash
# 1. 先登录（重要！避免速率限制）
clawhub login

# 2. 浏览最新技能
clawhub explore --limit 20

# 3. 搜索感兴趣领域（分层学习）
# 🔴 核心领域（每天必搜）
clawhub search "code review" --limit 5
clawhub search "architecture" --limit 5
clawhub search "aml" --limit 5
clawhub search "openclaw" --limit 5
clawhub search "ai agent" --limit 5
clawhub search "rag" --limit 5
clawhub search "langchain" --limit 5
clawhub search "claude" --limit 5

# 🟡 重要领域（每周轮换2个，根据周数选择）
# Week 1: database + devops | Week 2: kubernetes + frontend
# Week 3: testing + security | Week 4: performance + risk
clawhub search "<weekly_topic_1>" --limit 5
clawhub search "<weekly_topic_2>" --limit 5

# 🟢 了解领域（每月轮换1个，根据月份选择）
clawhub search "<monthly_topic>" --limit 5

# 4. 深入了解（认真学习）
clawhub inspect <skill-slug>

# 5. 安装并实践（努力修炼）
clawhub install <skill-slug>
```

**修炼原则**：

- 📚 先登录，再搜索
- 🔍 精挑细选，看评分和描述
- 🧠 认真学习，理解技能原理
- 💪 努力修炼，实践应用

### 3. 能力进化 (Capability Evolution)

定期评估：

- 哪些工具最常用？
- 哪些技能需要更新？
- 哪些新工具值得集成？
- 哪些旧能力可以淘汰？

### 4. 知识固化 (Knowledge Consolidation)

每天自动：

- 压缩碎片知识到 MEMORY.md
- 更新 SKILL.md 到最新实践
- 清理过时信息
- 建立知识索引

## 工作流程

### Phase 1: Scan (扫描阶段 - 每 30 分钟)

```
1. 检查项目状态
   - git status（如果有 repo）
   - 依赖变化
   - 配置漂移

2. 扫描学习机会
   - 最近的错误/失败
   - 重复的任务
   - 用户反馈模式

3. 更新 daily_report.md
   - 记录发现
   - 标记需要关注的项
```

### Phase 2: Learn (学习阶段 - 每次交互后)

```
1. 识别模式
   - 这个问题出现过吗？
   - 有通用的解决方案吗？
   - 用户有什么偏好？

2. 捕获知识
   - 写入相应的 evolution/*.md 文件
   - 建立交叉引用
   - 更新索引

3. 验证学习
   - 下次遇到类似问题时应用
   - 记录效果
```

### Phase 3: Evolve (进化阶段 - 每 6 小时)

```
1. 全面审查
   - 回顾最近的 learnings
   - 识别趋势
   - 发现改进机会

2. 知识整合
   - 合并重复条目
   - 提炼通用原则
   - 更新 MEMORY.md

3. 能力更新
   - 评估现有 SKILL.md
   - 创建/更新技能
   - 淘汰过时能力

4. 生成报告
   - 进化摘要
   - 关键发现
   - 建议行动
```

### Phase 4: Consolidate (固化阶段 - 每日)

```
1. 知识压缩
   - 合并 daily logs 到 MEMORY.md
   - 清理临时文件
   - 建立长期索引

2. 能力审计
   - 哪些能力被使用？
   - 哪些需要更新？
   - 哪些可以删除？

3. 目标更新
   - 回顾学习目标
   - 设置新目标
   - 调整优先级
```

## 文件结构

```
~/.openclaw/workspace/
├── MEMORY.md              # 长期记忆（进化后）
├── SOUL.md                # 个性（可能随学习调整）
├── HEARTBEAT.md          # 定期任务（包含进化检查）
├── EVOLUTION.md          # 进化系统配置
└── evolution/
    ├── PATTERNS.md        # 识别的模式
    ├── SOLUTIONS.md       # 验证的解决方案
    ├── LESSONS_LEARNED.md # 从失败中学习
    ├── PREFERENCES.md     # 用户偏好
    ├── CAPABILITIES.md     # 能力矩阵
    └── daily/
        └── YYYY-MM-DD.md   # 每日进化日志
```

## 配置

在 `~/.openclaw/config.json5` 中添加：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        prompt: `
          ## Evolution Heartbeat

          Phase: ${phase}

          1. Scan: Check for changes, updates, new patterns
          2. Learn: Capture knowledge from recent interactions
          3. Evolve: Update capabilities and consolidate knowledge
          4. Report: Update evolution/daily/YYYY-MM-DD.md

          If nothing needs attention, reply HEARTBEAT_OK.
        `,
      },
      compaction: {
        memoryFlush: {
          enabled: true,
          prompt: `
            ## Pre-Compaction Evolution Capture

            Before context compaction, write all learnings to:
            - evolution/PATTERNS.md (new patterns)
            - evolution/SOLUTIONS.md (working solutions)
            - evolution/LESSONS_LEARNED.md (what didn't work)

            Reply NO_REPLY if nothing to store.
          `,
        },
      },
    },
  },
}
```

## 触发词

| 触发词     | 行为               |
| ---------- | ------------------ |
| `进化分析` | 触发全面进化审查   |
| `学习模式` | 进入主动学习状态   |
| `模式识别` | 分析最近的交互模式 |
| `能力评估` | 评估当前能力矩阵   |
| `知识缺口` | 识别需要学习的领域 |
| `进化报告` | 生成进化状态报告   |
| `疯狂学习` | 进入高强度学习模式 |

## 示例用法

```
用户: "进化分析"
AI: 开始全面进化审查...
    - 扫描最近 30 天的交互记录
    - 识别 12 个重复模式
    - 发现 3 个可优化的工作流
    - 建议添加 2 个新技能
    [更新 evolution/PATTERNS.md]
    [生成进化报告]

用户: "疯狂学习"
AI: 进入疯狂学习模式！
    - 激活所有扫描器
    - 提高学习敏感度
    - 每 15 分钟检查一次
    - 自动捕获所有模式
    我现在处于高度学习状态，会主动识别和记录每一个学习机会。
```

## 进化指标

- Knowledge added: 本周新增知识点数量
- Patterns captured: 识别的模式数量
- Solutions found: 找到的解决方案数量
- Errors avoided: 通过学习避免的错误数量
- Capabilities evolved: 能力进化次数

## 注意事项

1. **不要过度进化** - 保持稳定，避免剧烈变化
2. **验证学习** - 獐的知识需要验证后才能固化
3. **保留历史** - 不要删除旧知识，而是归档
4. **用户确认** - 重大变化前询问用户

---

_此技能由 OpenClaw 自动维护。版本: 1.0.0_
