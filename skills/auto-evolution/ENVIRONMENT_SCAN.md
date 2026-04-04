# Environment Scan Protocol

> 让 OpenClaw 主动感知和学习环境信息

## 触发条件

- 用户说 "扫描环境"、"了解你自己"
- Heartbeat 进化阶段
- 首次启动时

---

## 扫描目标

### 1. GitHub 仓库信息

```bash
# 获取仓库信息
git remote -v
git log --oneline -5
git branch -a

# 检查 package.json
cat package.json | grep -E '"name"|"version"|"description"'
```

### 2. 官方文档

```bash
# 扫描本地文档
ls -la docs/

# 检查 README
head -50 README.md

# 检查 CHANGELOG
head -100 CHANGELOG.md
```

### 3. 社区信息

``bash

# 检查 Discord 链接（如果有配置）

grep -r "discord" docs/

# 检查 Hub 链接

grep -r "clawhub" docs/

````

### 4. 技术栈
```bash
# 检查依赖
cat package.json | grep -A 100 "dependencies"

# 检查扩展
ls -la extensions/

# 检查技能
ls -la skills/
````

---

## 学习协议

### Phase 1: 收集 (Collect)

```
1. 扫描上述所有来源
2. 提取关键信息
3. 验证信息准确性
```

### Phase 2: 整合 (Consolidate)

```
1. 合并重复信息
2. 解决冲突
3. 建立信息索引
```

### Phase 3: 固化 (Solidify)

```
1. 写入 IDENTITY.md
2. 更新 MEMORY.md
3. 建立交叉引用
```

---

## 自动更新触发器

### 配置变化时

- 扫描 package.json 变化
- 更新技术栈信息
- 检查新扩展/技能

### 文档更新时

- 扫描新文档
- 更新链接
- 同步到 IDENTITY.md

### 版本发布时

- 记录新版本
- 更新 CHANGELOG 摘要
- 标记里程碑

---

## 示例输出

```markdown
## 环境扫描报告 - 2026-03-08

### 📦 仓库状态

- 当前分支: main
- 最新提交: fix(ui): coerce form values
- 版本: 2026.2.9

### 📚 文档状态

- 文档文件: 637 个
- 语言: EN, ZH-CN, JA-JP
- 最近更新: heartbeat 文档

### 🔌 扩展状态

- 总扩展: 37 个
- 新增: [如果有新扩展]
- 变化: [如果有变化]

### 💡 学习要点

1. [新发现 1]
2. [新发现 2]
3. [需要关注]

### 📝 行动项

- [ ] [行动 1]
- [ ] [行动 2]
```

---

## 配置

在 HEARTBEAT.md 中添加:

```markdown
## 环境扫描 (首次启动时)

如果是首次运行或用户要求"扫描环境":

1. 运行 ENVIRONMENT_SCAN 协议
2. 更新 evolution/IDENTITY.md
3. 报告发现
```

---

_此协议由 OpenClaw 自动执行. 版本: 1.0.0_
