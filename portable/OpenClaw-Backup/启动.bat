@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

color 0A
cls
echo ==================================================
echo           OpenClaw Portable v2026.2.9
echo ==================================================
echo.
echo Platform: Windows x64
echo.

:: ===== Node.js =====
set "NODE_BIN="
set "PORTABLE_NODE=%~dp0runtime\node\win-x64\node.exe"

if exist "%PORTABLE_NODE%" (
    set "NODE_BIN=%PORTABLE_NODE%"
    for /f "tokens=*" %%i in ('"%PORTABLE_NODE%" -v') do echo   [OK] Node.js %%i
) else (
    where node >NUL 2>&1
    if !errorlevel! equ 0 (
        set "NODE_BIN=node"
        for /f "tokens=*" %%i in ('node -v') do echo   [OK] Node.js %%i
    ) else (
        color 0C
        echo   [ERROR] Node.js not found
        echo   Download from https://nodejs.org/
        pause
        exit /b 1
    )
)

set "CLI_FILE=%~dp0openclaw\dist\index.js"
if not exist "%CLI_FILE%" (
    color 0C
    echo   [ERROR] Missing openclaw\dist\index.js
    pause
    exit /b 1
)
echo   [OK] App ready
echo.

:: ===== Mode =====
"%NODE_BIN%" "%~dp0setup-mode.js"
if %errorlevel% equ 2 goto install_mode
goto usb_mode

:usb_mode
set "OPENCLAW_STATE_DIR=%~dp0data"
if not exist "%OPENCLAW_STATE_DIR%" mkdir "%OPENCLAW_STATE_DIR%"
echo.
echo -- USB Mode --
goto setup_config

:install_mode
set "INST=%USERPROFILE%\.openclaw-portable"
echo.
echo -- Install to: %INST% --
if not exist "%INST%" mkdir "%INST%"
echo   Copying app...
robocopy "%~dp0openclaw" "%INST%\openclaw" /E /NJH /NJS /NDL /NFL /NC /NS >nul
echo   Copying runtime...
robocopy "%~dp0runtime\node\win-x64" "%INST%\runtime\node\win-x64" /E /NJH /NJS /NDL /NFL /NC /NS >nul
if exist "%~dp0data" (
    echo   Copying data...
    robocopy "%~dp0data" "%INST%\data" /E /NJH /NJS /NDL /NFL /NC /NS >nul
)
set "OPENCLAW_STATE_DIR=%INST%\data"
if not exist "%OPENCLAW_STATE_DIR%" mkdir "%OPENCLAW_STATE_DIR%"

:: === Create bin\openclaw.bat (global command wrapper) ===
:: NOTE: %INST% is expanded by CMD at echo-write time, so the .bat file gets absolute paths
if not exist "%INST%\bin" mkdir "%INST%\bin"
echo @echo off> "%INST%\bin\openclaw.bat"
echo set "OPENCLAW_STATE_DIR=%INST%\data">> "%INST%\bin\openclaw.bat"
echo set "OPENCLAW_GATEWAY_TOKEN=portable">> "%INST%\bin\openclaw.bat"
echo if exist "%INST%\runtime\node\win-x64\node.exe" (>> "%INST%\bin\openclaw.bat"
echo     "%INST%\runtime\node\win-x64\node.exe" "%INST%\openclaw\dist\index.js" %%*>> "%INST%\bin\openclaw.bat"
echo ) else (>> "%INST%\bin\openclaw.bat"
echo     node "%INST%\openclaw\dist\index.js" %%*>> "%INST%\bin\openclaw.bat"
echo )>> "%INST%\bin\openclaw.bat"

:: === Add to user PATH via PowerShell ===
:: Use $env:USERPROFILE (not %USERPROFILE%) because this runs inside PowerShell
powershell -Command "$binDir=$env:USERPROFILE+'\openclaw-portable\bin'; $p=[Environment]::GetEnvironmentVariable('Path','User'); if($p -notlike '*openclaw-portable\bin*'){$np=$p+';'+$binDir;[Environment]::SetEnvironmentVariable('Path',$np,'User');Write-Host '  [OK] Added to PATH'}else{Write-Host '  [OK] Already in PATH'}"

:: === Create start.bat (gateway quick launcher) ===
echo @echo off> "%INST%\start.bat"
echo call "%INST%\bin\openclaw.bat" gateway --port 18789 --allow-unconfigured>> "%INST%\start.bat"

:: === Desktop shortcut ===
echo Set oWS = WScript.CreateObject("WScript.Shell")> "%TEMP%\sc.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\OpenClaw.lnk">> "%TEMP%\sc.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile)>> "%TEMP%\sc.vbs"
echo oLink.TargetPath = "%INST%\start.bat">> "%TEMP%\sc.vbs"
echo oLink.WorkingDirectory = "%INST%">> "%TEMP%\sc.vbs"
echo oLink.Save>> "%TEMP%\sc.vbs"
cscript //nologo "%TEMP%\sc.vbs" >NUL 2>&1
del "%TEMP%\sc.vbs" 2>nul
echo   [OK] Desktop shortcut created
echo.
echo [OK] Install complete!
echo [OK] Open a NEW terminal and type: openclaw
goto setup_config

:: ===== Config (via Node.js) =====
:setup_config
set "OPENCLAW_GATEWAY_TOKEN=portable"
"%NODE_BIN%" "%~dp0setup-config.js"

:: ===== Start Gateway =====
echo.
echo ==================================================
echo   Starting OpenClaw Gateway...
echo ==================================================
echo.
echo   http://localhost:18789
echo   Ctrl+C to stop
echo.

start "" cmd /c "ping -n 5 127.0.0.1 >NUL && start http://localhost:18789"

"%NODE_BIN%" "%CLI_FILE%" gateway --port 18789 --allow-unconfigured

echo.
echo Gateway stopped.
pause
