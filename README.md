# Hermes ESP32 Studio (`v1.0.0`)

面向 **ESP32 开发板**（含《你好！小智》ESP32-S3 及全系列 ESP32）的一体化测试、固件备份与开源应用管理工作台。

## 核心功能

1. **原始程序下载、备份与一键恢复**
   - 自动扫描本机串口（如 `COM5` / CH340 / CP210x）并调用 `esptool` 识别芯片型号、MAC 地址与 Flash 容量。
   - 一键读取板卡 `0x0` 起始全量 Flash 原始程序，自动附带版本号、时间戳、SHA-256 校验码归档至 `backups/` 目录。
   - 支持将备份 `.bin` 下载到本地保存，或随时一键恢复回 ESP32 开发板；亦支持上传任意 `.bin` 固件烧录。
2. **实时串口监视器**
   - 支持本地 Python 服务（SSE 实时流）与 Chrome/Edge 浏览器 **Web Serial API** 双模式直连 `COM5`，查看开发板日志并发送指令。
3. **功能需求工坊**
   - 在界面上直接录入想在 ESP32 上实现的新功能需求，自动分配需求版本号（`req-v1.0` 起）并生成 Arduino / ESP-IDF / MicroPython 初始代码框架。
   - 支持一键复制代码与一键提交到 GitHub Issues 进行追踪。
4. **GitHub 最新 ESP32 开源应用广场**
   - 内置 12 款当前 GitHub 活跃热门 ESP32 开源项目（涵盖 `78/xiaozhi-esp32`、`espressif/esp-idf`、`esphome/esphome`、`wled/WLED`、`arendst/Tasmota`、`lvgl/lvgl`、`meshtastic/firmware` 等），支持分类筛选、实时 GitHub 搜索及一键导入需求工坊。
5. **GitHub 版本管理与发布**
   - 全界面统一展示版本号（`VERSION` 文件管理，当前 `v1.0.0`），内置 GitHub Releases 发布记录查询与 CI 自动化检查。

## Windows 快速使用（连接 COM5）

> 前提：电脑已安装 Python 3.10+ 与 CH340/CH341 驱动（设备管理器中已识别 `COM5`）。

```bash
git clone https://github.com/HanweiJiang79/hermes.git
cd hermes
```

直接双击 **`start.bat`**，脚本会自动创建虚拟环境、安装 `esptool` 与 `pyserial` 依赖，并自动打开浏览器访问 `http://127.0.0.1:8765`。

### macOS / Linux 启动

```bash
chmod +x start.sh
./start.sh
```

## 目录结构

```text
hermes/
├── VERSION                # 语义化版本号 (1.0.0)
├── server.py              # FastAPI + esptool + pyserial 本地硬件桥接服务
├── requirements.txt       # Python 依赖
├── start.bat / start.sh   # 一键启动脚本
├── web/                   # 前端交互界面 (HTML / CSS / JS)
├── backups/               # ESP32 原始固件备份 (.bin + 元数据 .json)
├── data/                  # 本地需求档案存储
└── tests/                 # 自动化接口测试
```
