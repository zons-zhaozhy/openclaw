﻿# OpenClaw 便携版 - Windows 启动脚本 (PowerShell)
# UTF-8 with BOM, 原生支持中文

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Clear-Host
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "          OpenClaw 便携版 v2026.2.9" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ========== 1. 识别系统平台 ==========
$Platform = "win-x64"
$PlatformName = "Windows (x64)"
Write-Host "系统识别: $PlatformName => $Platform" -ForegroundColor Green
Write-Host ""

# ========== 2. 查找 Node.js ==========
$NodeBin = ""
$PortableNode = Join-Path $ScriptDir "runtime\node\$Platform\node.exe"

if (Test-Path $PortableNode) {
    $NodeBin = $PortableNode
    $nodeVer = & $NodeBin -v 2>$null
    Write-Host "  [OK] 使用便携版 Node.js $nodeVer" -ForegroundColor Green
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    $NodeBin = "node"
    $nodeVer = & node -v 2>$null
    Write-Host "  [OK] 使用系统 Node.js $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  [错误] 未找到 Node.js" -ForegroundColor Red
    Write-Host ""
    Write-Host "请访问 https://nodejs.org/ 下载安装，或联系提供者获取完整便携版。"
    Write-Host ""
    Read-Host "按回车退出"
    exit 1
}

# ========== 3. 验证程序文件 ==========
$CliFile = Join-Path $ScriptDir "openclaw\dist\index.js"
if (-not (Test-Path $CliFile)) {
    Write-Host "  [错误] 程序文件缺失！" -ForegroundColor Red
    Write-Host "openclaw\dist\index.js 不存在，请联系提供者。"
    Read-Host "按回车退出"
    exit 1
}
Write-Host "  [OK] OpenClaw 程序就绪" -ForegroundColor Green
Write-Host ""

# ========== 4. 选择模式 ==========
Write-Host "请选择：" -ForegroundColor Cyan
Write-Host "  1) U盘直接运行（数据存在U盘）"
Write-Host "  2) 安装到本机（推荐长期使用）"
Write-Host ""
$choice = Read-Host "选择 [1-2]"

if ($choice -eq "1") {
    # U盘模式
    $env:OPENCLAW_DATA_DIR = Join-Path $ScriptDir "data"
    if (-not (Test-Path $env:OPENCLAW_DATA_DIR)) {
        New-Item -ItemType Directory -Path "$env:OPENCLAW_DATA_DIR\config" -Force | Out-Null
    }
    Write-Host ""
    Write-Host "-> U盘模式" -ForegroundColor Green
}
elseif ($choice -eq "2") {
    # 安装到本机
    $InstallDir = Join-Path $env:USERPROFILE ".openclaw-portable"
    Write-Host ""
    Write-Host "-> 安装到: $InstallDir" -ForegroundColor Green
    Write-Host ""

    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }

    Write-Host "  复制程序文件..."
    $srcOpenclaw = Join-Path $ScriptDir "openclaw"
    $dstOpenclaw = Join-Path $InstallDir "openclaw"
    if (Test-Path $dstOpenclaw) { Remove-Item $dstOpenclaw -Recurse -Force }
    Copy-Item -Path $srcOpenclaw -Destination $dstOpenclaw -Recurse -Force

    Write-Host "  复制 Node 运行时 ($Platform)..."
    $srcRuntime = Join-Path $ScriptDir "runtime\node\$Platform"
    $dstRuntime = Join-Path $InstallDir "runtime\node\$Platform"
    if (-not (Test-Path $dstRuntime)) { New-Item -ItemType Directory -Path $dstRuntime -Force | Out-Null }
    Copy-Item -Path "$srcRuntime\*" -Destination $dstRuntime -Recurse -Force

    # 迁移数据
    $srcData = Join-Path $ScriptDir "data"
    if ((Test-Path $srcData) -and (Get-ChildItem $srcData -ErrorAction SilentlyContinue)) {
        Write-Host "  迁移数据..."
        $dstData = Join-Path $InstallDir "data"
        Copy-Item -Path $srcData -Destination $dstData -Recurse -Force
    }

    $env:OPENCLAW_DATA_DIR = Join-Path $InstallDir "data"
    if (-not (Test-Path "$env:OPENCLAW_DATA_DIR\config")) {
        New-Item -ItemType Directory -Path "$env:OPENCLAW_DATA_DIR\config" -Force | Out-Null
    }

    # 创建启动脚本
    $startBat = @"
@echo off
cd /d "$InstallDir"
set OPENCLAW_DATA_DIR=$InstallDir\data
set OPENCLAW_GATEWAY_TOKEN=portable
if exist "$InstallDir\runtime\node\$Platform\node.exe" (
    set NODE=$InstallDir\runtime\node\$Platform\node.exe
) else (
    set NODE=node
)
%NODE% "$InstallDir\openclaw\dist\index.js" gateway --port 18789
"@
    $startBatPath = Join-Path $InstallDir "start.bat"
    $startBat | Out-File -FilePath $startBatPath -Encoding ASCII

    # 创建桌面快捷方式
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\OpenClaw.lnk")
        $Shortcut.TargetPath = $startBatPath
        $Shortcut.WorkingDirectory = $InstallDir
        $Shortcut.Description = "OpenClaw 便携版"
        $Shortcut.Save()
        Write-Host "  [OK] 已创建桌面快捷方式" -ForegroundColor Green
    } catch {
        Write-Host "  [提示] 桌面快捷方式创建失败，不影响使用" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "[OK] 安装完成！" -ForegroundColor Green
}
else {
    Write-Host "无效选择" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

# ========== 5. 首次配置 ==========
$ConfigFile = Join-Path $env:OPENCLAW_DATA_DIR "config\openclaw.json"
if (-not (Test-Path $ConfigFile)) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  首次使用 - 配置 AI 模型" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "选择 AI 提供商："
    Write-Host "  1) 智谱 AI (GLM)       - 中文优秀，国内可用"
    Write-Host "  2) OpenAI (ChatGPT)    - 功能强大"
    Write-Host "  3) Claude (Anthropic)  - 安全可靠"
    Write-Host "  4) 月之暗面 (Moonshot) - 长文本处理强"
    Write-Host "  5) 跳过（稍后配置）"
    Write-Host ""
    $modelChoice = Read-Host "选择 [1-5]"

    $Provider = ""
    switch ($modelChoice) {
        "1" { $Provider = "zai";       Write-Host "获取 API Key: https://open.bigmodel.cn/" }
        "2" { $Provider = "openai";    Write-Host "获取 API Key: https://platform.openai.com/api-keys" }
        "3" { $Provider = "anthropic"; Write-Host "获取 API Key: https://console.anthropic.com/" }
        "4" { $Provider = "moonshot";  Write-Host "获取 API Key: https://platform.moonshot.cn/" }
        default { Write-Host "-> 跳过配置" }
    }

    if ($Provider -ne "") {
        Write-Host ""
        $ApiKey = Read-Host "请输入 API Key"
        if ($ApiKey -ne "") {
            $ConfigDir = Join-Path $env:OPENCLAW_DATA_DIR "config"
            if (-not (Test-Path $ConfigDir)) {
                New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
            }
            $configJson = @"
{
  "agents": {
    "defaults": {
      "model": "$Provider/default"
    }
  },
  "auth": {
    "profiles": {
      "$Provider`:manual": {
        "apiKey": "$ApiKey"
      }
    }
  }
}
"@
            $configJson | Out-File -FilePath $ConfigFile -Encoding UTF8
            Write-Host "[OK] 配置已保存" -ForegroundColor Green
        }
    }
}

# ========== 6. 启动 Gateway ==========
$Port = 18789
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  启动 OpenClaw Gateway..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  浏览器访问: http://localhost:$Port"
Write-Host "  按 Ctrl+C 停止服务"
Write-Host ""

$env:OPENCLAW_GATEWAY_TOKEN = "portable"

# 后台启动 gateway，同时监测健康状态来开浏览器
$gatewayJob = Start-Job -ScriptBlock {
    param($nb, $cf, $p)
    & $nb $cf gateway --port $p 2>&1
} -ArgumentList $NodeBin, $CliFile, $Port

# 等待 gateway 就绪后自动打开浏览器
Write-Host "正在等待 Gateway 就绪..."
$browserOpened = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $browserOpened = $true
            Write-Host "[OK] Gateway 已就绪，正在打开浏览器..." -ForegroundColor Green
            Start-Process "http://localhost:$Port"
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $browserOpened) {
    Write-Host "提示: 浏览器未自动打开，请手动访问 http://localhost:$Port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Gateway 运行中，关闭此窗口将停止服务..."
Write-Host ""

# 保持窗口打开，持续输出 gateway 日志
try {
    while ($true) {
        $output = Receive-Job -Job $gatewayJob -ErrorAction SilentlyContinue
        if ($output) { Write-Host $output }
        $state = Get-Job -Id $gatewayJob.Id | Select-Object -ExpandProperty State
        if ($state -eq "Completed" -or $state -eq "Failed") {
            Write-Host "Gateway 已停止运行。" -ForegroundColor Yellow
            break
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Stop-Job -Job $gatewayJob -ErrorAction SilentlyContinue
    Remove-Job -Job $gatewayJob -Force -ErrorAction SilentlyContinue
}
