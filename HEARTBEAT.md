# HEARTBEAT.md

## 心跳任务

- 检查 `memory/todo.md` 中的待办队列，拉取下一个任务执行
- 如果当前正在执行任务，继续推进（不要停下来）
- 检查 `~/.openclaw/logs/gateway.err.log` 最后 20 行是否有新的 `[server-chat]` debug log 输出（streaming bug 排查）
