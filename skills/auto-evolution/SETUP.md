# Auto-Evolution 快速设置指南

> 5 分钟启用 OpenClaw 自动进化系统

## 第一步： 复制文件到工作空间

```bash
# 创建 evolution 目录
mkdir -p ~/.openclaw/workspace/evolution/daily

# 复制模板文件
cp skills/auto-evolution/templates/*.md ~/.openclaw/workspace/evolution/

# 复制配置文件
cp AUTO_EVOLUTION.md ~/.openclaw/workspace/EVOLUTION.md
```

## 第二步: 更新 HEARTBEAT.md

```bash
cat > ~/.openclaw/workspace/HEARTBEAT.md << 'EOF'
# Heartbeat with Evolution

## 每 30 分钟检查
1. 扫描项目变化和更新
2. 识别学习机会
3. 更新 daily_report.md

## 每 6 小时进化
1. 审查 recent learnings
2. 更新 MEMORY.md
3. 生成进化报告

如果只是例行检查，回复 HEARTBEAT_OK
EOF
```

## 第三步: 更新配置

在 `~/.openclaw/config.json5` 中添加:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        prompt: `
          ## Evolution Heartbeat

          Phase: scan

          1. Check for:
             - Project changes (git status if available)
             - Dependency updates (package.json changes)
             - Configuration drift
             - New patterns in recent interactions

          2. Update evolution/daily/YYYY-MM-DD.md with findings

          3. If nothing critical, reply HEARTBEAT_OK
        `,
      },
      compaction: {
        memoryFlush: {
          enabled: true,
          systemPrompt: "Evolution checkpoint. Capture all learnings before context compaction.",
          prompt: `
            ## Pre-Compaction Evolution Capture

            Write lasting learnings to:
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

## 第四步: 重启 Gateway

```bash
openclaw gateway restart
```

## 第五步: 预热系统

```bash
# 触发第一次进化分析
openclaw system event --text "Initial evolution scan - bootstrap the auto-evolution system" --mode now
```

## 验证安装

```bash
# 检查文件是否创建
ls -la ~/.openclaw/workspace/evolution/

# 检查 heartbeat 状态
openclaw status | grep -i heartbeat

# 查看今天的报告
cat ~/.openclaw/workspace/evolution/daily/$(date +%Y-%m-%d).md
```

## 触发进化

在对话中使用这些命令:

| 命令       | 效果               |
| ---------- | ------------------ |
| `进化分析` | 触发全面进化审查   |
| `疯狂学习` | 进入高强度学习模式 |
| `进化报告` | 生成当前进化状态   |
| `模式识别` | 分析最近的交互模式 |

## 示例会话

```
你: 进化分析

OpenClaw: 🔍 开始进化分析...

Phase 1: Scan
- 检查到 3 个依赖更新
- 发现 2 个配置漂移
- 识别 5 个学习机会

Phase 2: Learn
- 捕获 2 个新模式到 PATTERNS.md
- 记录 1 个解决方案到 SOLUTIONS.md
- 识别 1 个需要避免的错误

Phase 3: Evolve
- 更新 MEMORY.md 添加 3 个知识点
- 建议 1 个新技能

Phase 4: Report
- 生成 daily/2026-03-08.md
- 进化效率: 85%

✅ 进化周期完成
```

## 进化时间线

```
00:00 ─── Heartbeat (Scan) ─── 检查变化
00:30 ─── Heartbeat (Scan) ─── 检查变化
01:00 ─── Heartbeat (Scan) ─── 检查变化
01:30 ─── Heartbeat (Scan) ─── 检查变化
02:00 ─── Heartbeat (Scan) ─── 检查变化
02:30 ─── Heartbeat (Scan) ─── 检查变化
03:00 ─── Heartbeat (Evolve) ─ 全面进化
03:30 ─── Heartbeat (Scan) ─── 检查变化
...
06:00 ─── Heartbeat (Evolve) ─ 全面进化
...
24:00 ─── Daily Report ─── 日报生成
```

## 自定义配置

### 调整学习速度

```json5
// 高强度学习（每 15 分钟）
heartbeat: { every: "15m" }

// 适中学习（每 1 小时）
heartbeat: { every: "1h" }

// 保守学习（每 2 小时）
heartbeat: { every: "2h" }
```

### 调整进化频率

```json5
// 快速进化（每 3 小时）
// 在 heartbeat prompt 中设置 "Phase: evolve" 每 6 个 heartbeat

// 正常进化（每 6 小时）
// 默认设置

// 慢速进化（每 12 小时）
// 在 heartbeat prompt 中设置 "Phase: evolve" 每 24 个 heartbeat
```

### 静默时段

```json5
heartbeat: {
  every: "30m",
  activeHours: {
    start: "09:00",
    end: "22:00",  // 晚 10 点后停止学习
    timezone: "America/Los_Angeles"
  }
}
```

---

## 下一步

1. **观察学习** - 知道 OpenClaw 自动捕获模式
2. **定期检查** - 查看 `evolution/daily/*.md` 报告
3. **提供反馈** - 告诉 OpenClaw 哪些学习有效
4. **调整配置** - 根据需要调整学习速度

---

_设置完成后，OpenClaw 将进入持续学习状态！_
