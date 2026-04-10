---
name: knowledge-compiler
description: "Extract and compile knowledge from sessions after compaction"
homepage: https://docs.openclaw.ai/automation/hooks#knowledge-compiler
metadata:
  {
    "openclaw":
      {
        "emoji": "🧠",
        "events": ["session:compact:after"],
        "requires": { "config": ["workspace.dir"] },
        "install": [{ "id": "bundled", "kind": "bundled", "label": "Bundled with OpenClaw" }],
      },
  }
---

# Knowledge Compiler Hook

Compiles knowledge from session conversations after compaction, implementing
Karpathy's "knowledge compilation" approach: extract durable insights from
ephemeral conversations.

## What It Does

After each compaction event:

1. **Reads recent conversation** from the session JSONL transcript
2. **Extracts knowledge** using LLM: patterns, decisions, lessons learned
3. **Deduplicates** against existing compiled knowledge
4. **Writes to workspace** as `COMPILED-KNOWLEDGE.md` for bootstrap injection

## Output Format

Knowledge is stored as structured Markdown in `<workspace>/COMPILED-KNOWLEDGE.md`:

```markdown
# Compiled Knowledge

## Patterns

- [YYYY-MM-DD] Pattern description

## Decisions

- [YYYY-MM-DD] Decision: reason

## Lessons

- [YYYY-MM-DD] Lesson learned
```

## Configuration

| Option     | Type   | Default | Description                       |
| ---------- | ------ | ------- | --------------------------------- |
| maxEntries | number | 30      | Max knowledge entries to keep     |
| maxChars   | number | 3000    | Max total chars for compiled file |

Example:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "knowledge-compiler": {
          "enabled": true,
          "maxEntries": 50,
          "maxChars": 5000
        }
      }
    }
  }
}
```

## Enable

```bash
openclaw hooks enable knowledge-compiler
```

## Disable

```bash
openclaw hooks disable knowledge-compiler
```
