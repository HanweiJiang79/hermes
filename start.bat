@echo off
chcp 65001 >nul
title Hermes ESP32 Studio v1.0.1

echo ============================================
echo   Hermes ESP32 Studio v1.0.1
echo   ESP32 固件备份 / 恢复 / 需求工坊 / 应用广场
echo ============================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.10+ 并勾选 Add Python to PATH。
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] 正在创建 Python 虚拟环境...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [错误] 创建虚拟环境失败，请检查 Python 安装是否完整。
        pause
        exit /b 1
    )
)

echo [2/3] 正在检查并安装依赖 (esptool, pyserial, fastapi)...
.venv\Scripts\python.exe -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [提示] 默认源安装失败，正在尝试使用国内清华镜像源安装...
    .venv\Scripts\python.exe -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请将上方报错截图发送排查。
        pause
        exit /b 1
    )
)

echo [3/3] 正在启动本地服务: http://127.0.0.1:8765
echo       服务启动后将在 3 秒内自动打开浏览器（请勿关闭本窗口）...
start /min "" cmd /c "timeout /t 3 /nobreak >nul && start http://127.0.0.1:8765"
.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8765

pause
