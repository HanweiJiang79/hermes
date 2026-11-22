@echo off
chcp 65001 >nul
title Hermes ESP32 Studio v1.0.0

echo ============================================
echo   Hermes ESP32 Studio v1.0.0
echo   ESP32 固件备份 / 恢复 / 需求工坊 / 应用广场
echo ============================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.10+ 并勾选 Add Python to PATH。
    pause
    exit /b 1
)

if not exist ".venv" (
    echo [1/3] 正在创建 Python 虚拟环境...
    python -m venv .venv
)

echo [2/3] 正在检查并安装依赖 (esptool, pyserial, fastapi)...
.venv\Scripts\python.exe -m pip install --upgrade pip -q
.venv\Scripts\python.exe -m pip install -r requirements.txt -q

echo [3/3] 正在启动本地服务: http://127.0.0.1:8765
start "" http://127.0.0.1:8765
.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8765

pause
