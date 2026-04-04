# Auto-Evolution 快速参考

> 一页掌握 OpenClaw 自动进化系统

---

## 🎯 核心理念

**持续学习 → 自我改进 → 适应变化**

---

## 📁 文件结构

```
~/.openclaw/workspace/
├── EVOLUTION.md              # 进化配置（主文档）
├── HEARTBEAT.md             # 定期任务（含进化检查）
├── MEMORY.md                # 长期记忆（进化后）
└── evolution/
    ├── IDENTITY.md          # 自我身份认知
    ├── PATTERNS.md          # 识别的模式
    ├── SOLUTIONS.md         # 验证的解决方案
    ├── LESSONS_LEARNED.md   # 从失败中学习
    ├── PREFERENCES.md       # 用户偏好
    ├── CAPABILITIES.md      # 能力矩阵
    └── daily/
        └── YYYY-MM-DD.md    # 每日进化日志
```

---

## ⏰ 进化节奏

| 频率         | 活动 | 输出                    |
| ------------ | ---- | ----------------------- |
| **30分钟**   | 扫描 | daily_report.md         |
| **每次交互** | 学习 | 更新 PATTERNS/SOLUTIONS |
| **6小时**    | 进化 | 更新 MEMORY.md          |
| **每天**     | 固化 | 压缩知识                |
| **每周**     | 审计 | 能力评估                |

---

## 🚀 触发词

| 词         | 行为       |
| ---------- | ---------- |
| `进化分析` | 全面审查   |
| `疯狂学习` | 高强度模式 |
| `模式识别` | 分析模式   |
| `能力评估` | 评估能力   |
| `知识缺口` | 识别需求   |
| `扫描环境` | 焟知环境   |
| `进化报告` | 生成报告   |

---

## 🔧 配置要点

```json5
// config.json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 扫描频率
        prompt: "...", // 含进化检查
      },
      compaction: {
        memoryFlush: {
          enabled: true, // 启用记忆保存
        },
      },
    },
  },
}
```

---

## 📊 进化指标

- **Knowledge added**: 新增知识点
- **Patterns captured**: 识别的模式
- **Solutions found**: 找到的方案
- **Errors avoided**: 避免的错误
- **Capabilities evolved**: 能力进化

---

## 🎓 学习模式

### 保守（默认）

- 仅在明确发现时记录
- 需要用户确认重大变化
- 适合稳定环境

### 平衡（推荐）

- 自动记录明显模式
- 定期生成进化报告
- 适合成长环境

### 激进（疯狂学习）

- 主动扫描所有机会
- 高频率学习和进化
- 适合快速变化环境

---

## ⚠️ 注意事项

1. **不要过度进化** - 保持稳定
2. **验证学习** - 籂草变玫瑰
3. **保留历史** - 归档而非删除
4. **用户确认** - 重大变化前询问

---

## 🔄 典型工作流

```
用户交互
    ↓
识别模式 → PATTERNS.md
    ↓
验证有效 → SOLUTIONS.md
    ↓
定期进化 → MEMORY.md
    ↓
固化知识 → 长期记忆
```

---

## 📚 相关文件

- `AUTO_EVOLUTION.md` - 完整设计文档
- `SETUP.md` - 快速设置指南
- `SKILL.md` - 技能定义
- `ENVIRONMENT_SCAN.md` - 环境扫描协议
- `CODING_ASSISTANT.md` - 编程助手模式
- `templates/IDENTITY.md` - 自我身份认知
- `templates/CODING_PATTERNS.md` - 编程模式库

---

_快速参考 v1.1.0 | 2026-03-08_
_新增: 编程助手模式 (CODING_ASSISTANT.md)_
