# Coding Patterns

> 从项目中学习到的代码模式和最佳实践

## 使用方式

记录在编程过程中发现的模式和最佳实践。

---

## 🏗️ 架构模式

### Pattern: [Pattern Name]

- **描述**: [简要描述]
- **应用场景**: [什么时候使用]
- **示例代码**:

```typescript
// 示例代码
```

- **优点**: [优势]
- **注意**: [需要注意的点]
- **首次发现**: YYYY-MM-DD

---

## 🔧 代码模式

### 错误处理模式

- **描述**: 项目中使用的错误处理方式
- **示例**:

```typescript
// 统一的错误处理
try {
  // 操作
} catch (error) {
  logger.error(`操作失败: ${error}`);
  throw error; // 重新抛出
}
```

- **应用**: 全局

### 异步模式

- **描述**: 处理异步操作的方式
- **示例**:

```typescript
// 使用 async/await
async function fetchData() {
  const result = await promise;
  return result;
}
```

---

## 📝 命名规范

### 文件命名

- **组件**: PascalCase (e.g., `Button.tsx`)
- **工具**: camelCase (e.g., `formatDate.ts`)
- **类型**: PascalCase + .type (e.g., `User.type.ts`)
- **测试**: 原文件名 + .test (e.g., `formatDate.test.ts`)

### 变量命名

- **常量**: UPPER_SNAKE_CASE
- **变量**: camelCase
- **私有**: \_leadingUnderscore
- **接口**: IPascalCase

### 函数命名

- **动作**: verbNoun (e.g., `getUser`, `deleteFile`)
- **布尔**: is/has/can + Noun (e.g., `isValid`, `hasPermission`)
- **事件**: on + Event (e.g., `onClick`, `onChange`)

---

## 🎯 项目特定模式

### 依赖注入

```typescript
// 使用工厂函数创建依赖
function createDefaultDeps(): Dependencies {
  return {
    logger: createLogger(),
    config: loadConfig(),
  };
}
```

### 配置管理

```typescript
// 配置使用 JSON5 格式
// 支持注释和尾随逗号
{
  agents: {
    defaults: {
      // 配置注释
      heartbeat: {
        every: "30m",
      },
    },
  },
}
```

### 工具定义

```typescript
// 使用 TypeBox 或 Zod 定义工具 schema
const schema = TypeBox.Object({
  name: TypeBox.String(),
  value: TypeBox.Number(),
});
```

---

## 🚫 反模式 (Anti-Patterns)

### 避免使用

1. **版本文件** - 不要创建 `file-v2.ts`
2. **简化异常** - 不要 `catch (e) { console.log(e); }`
3. **相对导入** - 使用绝对导入
4. **硬编码** - 配置应该从文件读取

### 正确做法

```typescript
// ❌ 错误
import { helper } from "./helper";

// ✅ 正确
import { helper } from "src/utils/helper.js";
```

---

## 📊 模式统计

| 模式类型 | 已学习 | 最常用    |
| -------- | ------ | --------- |
| 架构模式 | 0      | -         |
| 代码模式 | 2      | 异步模式  |
| 命名规范 | 10+    | camelCase |
| 反模式   | 4      | 鑫对导入  |

---

## 🔗 相关文件

- `SOLUTIONS.md` - 韶决的具体问题方案
- `LESSONS_LEARNED.md` - 从失败中学习
- `CAPABILITIES.md` - 当前能力状态

---

_此文件由 OpenClaw 自动维护. 最后更新: 2026-03-08_
