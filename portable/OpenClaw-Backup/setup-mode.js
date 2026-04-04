// setup-mode.js - OpenClaw 模式选择（Node.js 原生 UTF-8，中文零问题）
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("");
console.log("请选择：");
console.log("  1) U盘直接运行（数据存在U盘）");
console.log("  2) 安装到本机（推荐长期使用）");
console.log("");

rl.question("选择 [1-2]: ", (choice) => {
  rl.close();
  if (choice.trim() === "2") {
    process.exit(2); // install mode
  } else {
    process.exit(1); // usb mode
  }
});
