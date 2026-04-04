// setup-config.js - OpenClaw 配置（Node.js 原生 UTF-8，中文零问题）
// 策略：读旧配置提取凭证 → 用正确模板重写 → 缺凭证才提示用户输入
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const stateDir = process.env.OPENCLAW_STATE_DIR || path.join(require("os").homedir(), ".openclaw");
const configFile = path.join(stateDir, "openclaw.json");

const providers = {
  1: {
    id: "zai",
    name: "智谱 AI (GLM)",
    model: "glm-4-flash",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  },
  2: {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
  },
  3: {
    id: "anthropic",
    name: "Claude (Anthropic)",
    model: "claude-sonnet-4-20250514",
    baseUrl: "",
  },
  4: {
    id: "deepseek",
    name: "DeepSeek",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
  },
  5: {
    id: "moonshot",
    name: "月之暗面 (Moonshot)",
    model: "moonshot-v1-8k",
    baseUrl: "https://api.moonshot.cn/v1",
  },
};

// 生成符合 schema 的配置（单一来源，不会有遗漏）
function buildConfig(providerId, apiKey) {
  var p = providers[providerId];
  if (!p) {
    return null;
  }
  var modelRef = p.id + "/" + p.model;
  var config = {
    gateway: { mode: "local" },
    plugins: { slots: { memory: "none" } },
    agents: {
      defaults: {
        model: { primary: modelRef },
        models: {},
      },
    },
    models: { providers: {} },
  };
  config.agents.defaults.models[modelRef] = {};
  config.models.providers[p.id] = {
    apiKey: apiKey,
    models: [{ id: p.model, name: p.name + " " + p.model }],
  };
  if (p.baseUrl) {
    config.models.providers[p.id].baseUrl = p.baseUrl;
  }
  return config;
}

// 尝试从旧配置中提取凭证
function extractOldCredentials() {
  if (!fs.existsSync(configFile)) {
    return null;
  }
  try {
    var old = JSON.parse(fs.readFileSync(configFile, "utf8"));
    var provs = old && old.models && old.models.providers;
    if (!provs) {
      return null;
    }
    for (var pid in provs) {
      var prov = provs[pid];
      if (prov && prov.apiKey && prov.models && prov.models.length > 0) {
        return { providerId: pid, apiKey: prov.apiKey, modelId: prov.models[0].id };
      }
    }
  } catch {
    /* broken */
  }
  return null;
}

// 检查现有配置是否完整（有 plugins.slots.memory）
function configIsValid() {
  if (!fs.existsSync(configFile)) {
    return false;
  }
  try {
    var c = JSON.parse(fs.readFileSync(configFile, "utf8"));
    if (
      !c.plugins ||
      !c.plugins.slots ||
      typeof c.plugins.slots.memory !== "string" ||
      !c.plugins.slots.memory.trim()
    ) {
      return false;
    }
    if (!c.models || !c.models.providers) {
      return false;
    }
    for (var pid in c.models.providers) {
      var prov = c.models.providers[pid];
      if (prov.models && prov.models[0] && !prov.models[0].name) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// ===== 主逻辑 =====

// 1. 配置完整且有效 → 直接用
if (configIsValid()) {
  console.log("[OK] 配置已存在且有效");
  process.exit(0);
}

// 2. 有旧凭证 → 自动迁移到新模板，无需用户操作
var cred = extractOldCredentials();
if (cred) {
  // 匹配 provider
  var matchedPid = null;
  for (var k in providers) {
    if (providers[k].id === cred.providerId) {
      matchedPid = k;
      break;
    }
  }
  // 如果旧的 provider 不在列表中（比如自定义），用第一个匹配的 model
  if (!matchedPid) {
    for (var k2 in providers) {
      if (providers[k2].model === cred.modelId || providers[k2].id === cred.providerId) {
        matchedPid = k2;
        break;
      }
    }
  }
  if (matchedPid) {
    var config = buildConfig(matchedPid, cred.apiKey);
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf8");
    console.log("[OK] 配置已自动迁移");
    process.exit(0);
  }
}

// 3. 无凭证 → 交互式配置
var rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("");
console.log("==================================================");
console.log("  首次使用 - 配置 AI 模型");
console.log("==================================================");
console.log("");
console.log("选择 AI 提供商：");
console.log("  1) 智谱 AI (GLM)       - 中文优秀，国内直连");
console.log("  2) OpenAI (ChatGPT)    - 功能最强大");
console.log("  3) Claude (Anthropic)  - 安全可靠");
console.log("  4) DeepSeek            - 性价比高");
console.log("  5) 月之暗面 (Moonshot) - 长文本处理强");
console.log("  6) 跳过（稍后配置）");
console.log("");

rl.question("选择 [1-6]: ", function (choice) {
  var p = providers[choice];
  if (!p) {
    console.log("-- 已跳过 --");
    rl.close();
    process.exit(0);
  }

  console.log(
    "获取 API Key: " +
      (p.id === "zai"
        ? "https://open.bigmodel.cn/"
        : p.id === "openai"
          ? "https://platform.openai.com/api-keys"
          : p.id === "anthropic"
            ? "https://console.anthropic.com/"
            : p.id === "deepseek"
              ? "https://platform.deepseek.com/"
              : "https://platform.moonshot.cn/"),
  );
  rl.question("请输入 API Key: ", function (apiKey) {
    if (!apiKey || apiKey.trim() === "") {
      console.log("-- 未输入 Key，稍后配置 --");
      rl.close();
      process.exit(0);
    }

    var config = buildConfig(choice, apiKey.trim());
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf8");
    console.log("");
    console.log("[OK] 配置已保存");
    console.log("[OK] 模型: " + config.agents.defaults.model.primary);
    console.log("");

    rl.close();
  });
});
