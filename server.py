"""Hermes ESP32 Studio — Local Hardware Bridge & Web Server."""

from __future__ import annotations

import hashlib
import json
import platform
import queue
import re
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
BACKUPS_DIR = BASE_DIR / "backups"
DATA_DIR = BASE_DIR / "data"
REQUIREMENTS_FILE = DATA_DIR / "requirements.json"
VERSION_FILE = BASE_DIR / "VERSION"
GITHUB_REPO = "HanweiJiang79/hermes"

BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

APP_VERSION = VERSION_FILE.read_text(encoding="utf-8").strip() if VERSION_FILE.exists() else "1.0.0"

# Curated latest ESP32 open-source applications (verified via GitHub Search, Nov 2026)
CURATED_ESP32_APPS: list[dict[str, Any]] = [
    {
        "fullName": "78/xiaozhi-esp32",
        "name": "xiaozhi-esp32",
        "category": "AI 语音 / 小智",
        "language": "C++",
        "stargazersCount": 33577,
        "updatedAt": "2026-11-22T02:38:40Z",
        "url": "https://github.com/78/xiaozhi-esp32",
        "releasesUrl": "https://github.com/78/xiaozhi-esp32/releases",
        "description": "基于 MCP 协议的开源 AI 语音聊天机器人固件，支持 ESP32-S3 / 小智开发板、语音唤醒、大模型对话与外设控制。",
        "recommendedFor": "小智开发板 / ESP32-S3",
    },
    {
        "fullName": "xinnan-tech/xiaozhi-esp32-server",
        "name": "xiaozhi-esp32-server",
        "category": "AI 语音 / 小智",
        "language": "JavaScript",
        "stargazersCount": 11364,
        "updatedAt": "2026-11-22T02:54:24Z",
        "url": "https://github.com/xinnan-tech/xiaozhi-esp32-server",
        "releasesUrl": "https://github.com/xinnan-tech/xiaozhi-esp32-server/releases",
        "description": "xiaozhi-esp32 开源后端控制服务器，支持自定义 LLM、TTS/ASR、声纹与智能设备联动。",
        "recommendedFor": "小智配套后端",
    },
    {
        "fullName": "Maggotxy/xiaozhi-esp32-music",
        "name": "xiaozhi-esp32-music",
        "category": "AI 语音 / 小智",
        "language": "C++",
        "stargazersCount": 362,
        "updatedAt": "2026-11-20T05:49:50Z",
        "url": "https://github.com/Maggotxy/xiaozhi-esp32-music",
        "releasesUrl": "https://github.com/Maggotxy/xiaozhi-esp32-music/releases",
        "description": "小智 AI 机器人音乐播放增强固件，支持点歌、音频流解码与播放控制。",
        "recommendedFor": "小智开发板 / 音频",
    },
    {
        "fullName": "espressif/esp-idf",
        "name": "esp-idf",
        "category": "官方框架",
        "language": "C",
        "stargazersCount": 19565,
        "updatedAt": "2026-11-22T01:48:13Z",
        "url": "https://github.com/espressif/esp-idf",
        "releasesUrl": "https://github.com/espressif/esp-idf/releases",
        "description": "乐鑫官方 IoT 开发框架，提供全系列 ESP32 SoC 底层驱动、FreeRTOS、Wi-Fi/BLE 协议栈与烧录工具。",
        "recommendedFor": "全系列 ESP32",
    },
    {
        "fullName": "espressif/arduino-esp32",
        "name": "arduino-esp32",
        "category": "官方框架",
        "language": "C++",
        "stargazersCount": 17783,
        "updatedAt": "2026-11-22T03:29:20Z",
        "url": "https://github.com/espressif/arduino-esp32",
        "releasesUrl": "https://github.com/espressif/arduino-esp32/releases",
        "description": "乐鑫官方维护的 Arduino 核心库，生态丰富、上手极快，适合传感器测试与原型验证。",
        "recommendedFor": "快速原型开发",
    },
    {
        "fullName": "esphome/esphome",
        "name": "esphome",
        "category": "智能家居",
        "language": "C++",
        "stargazersCount": 12147,
        "updatedAt": "2026-11-22T00:37:24Z",
        "url": "https://github.com/esphome/esphome",
        "releasesUrl": "https://github.com/esphome/esphome/releases",
        "description": "通过 YAML 配置文件即可生成 ESP32 固件，无缝接入 Home Assistant 实现远程自动化控制。",
        "recommendedFor": "智能家居 / HA",
    },
    {
        "fullName": "arendst/Tasmota",
        "name": "Tasmota",
        "category": "智能家居",
        "language": "C",
        "stargazersCount": 25009,
        "updatedAt": "2026-11-21T14:44:22Z",
        "url": "https://github.com/arendst/Tasmota",
        "releasesUrl": "https://github.com/arendst/Tasmota/releases",
        "description": "开源全功能智能设备固件，自带 WebUI、OTA 升级、定时规则与 MQTT/HTTP 本地控制。",
        "recommendedFor": "开关 / 传感器节点",
    },
    {
        "fullName": "wled/WLED",
        "name": "WLED",
        "category": "智能家居",
        "language": "C++",
        "stargazersCount": 19098,
        "updatedAt": "2026-11-21T19:19:38Z",
        "url": "https://github.com/wled/WLED",
        "releasesUrl": "https://github.com/wled/WLED/releases",
        "description": "通过 Wi-Fi 控制 WS2812B 等数字 RGB 灯带的明星 ESP32 固件，内置百余种动态灯效与音频同步。",
        "recommendedFor": "RGB 灯带 / 氛围灯",
    },
    {
        "fullName": "lvgl/lvgl",
        "name": "lvgl",
        "category": "图形界面",
        "language": "C",
        "stargazersCount": 25221,
        "updatedAt": "2026-11-22T03:16:38Z",
        "url": "https://github.com/lvgl/lvgl",
        "releasesUrl": "https://github.com/lvgl/lvgl/releases",
        "description": "嵌入式领域最流行的开源图形界面库，完美适配 ESP32-S3 LCD/OLED 触摸屏与仪表盘开发。",
        "recommendedFor": "带屏 ESP32 开发板",
    },
    {
        "fullName": "meshtastic/firmware",
        "name": "Meshtastic",
        "category": "通信与极客",
        "language": "C++",
        "stargazersCount": 8619,
        "updatedAt": "2026-11-21T21:02:05Z",
        "url": "https://github.com/meshtastic/firmware",
        "releasesUrl": "https://github.com/meshtastic/firmware/releases",
        "description": "开源离网 LoRa Mesh 通信固件，无需基站即可实现远距离文本与位置加密通信。",
        "recommendedFor": "LoRa / 离网通信",
    },
    {
        "fullName": "justcallmekoko/ESP32Marauder",
        "name": "ESP32Marauder",
        "category": "通信与极客",
        "language": "C++",
        "stargazersCount": 13188,
        "updatedAt": "2026-11-22T02:50:17Z",
        "url": "https://github.com/justcallmekoko/ESP32Marauder",
        "releasesUrl": "https://github.com/justcallmekoko/ESP32Marauder/releases",
        "description": "ESP32 Wi-Fi / 蓝牙安全测试与频谱分析工具套件，常用于无线协议研究与渗透测试学习。",
        "recommendedFor": "无线安全测试",
    },
    {
        "fullName": "BruceDevices/firmware",
        "name": "Bruce Firmware",
        "category": "通信与极客",
        "language": "C++",
        "stargazersCount": 7354,
        "updatedAt": "2026-11-22T03:32:13Z",
        "url": "https://github.com/BruceDevices/firmware",
        "releasesUrl": "https://github.com/BruceDevices/firmware/releases",
        "description": "多合一 ESP32 极客便携固件，集成红外、射频、RFID、Wi-Fi、蓝牙及 WebUI 管理功能。",
        "recommendedFor": "M5Stick / Cardputer / S3",
    },
]

# Active background tasks (backup / restore / flash)
TASKS: dict[str, dict[str, Any]] = {}
TASKS_LOCK = threading.Lock()

# Active serial monitor sessions
SERIAL_STOP_EVENTS: dict[str, threading.Event] = {}
SERIAL_CONNECTIONS: dict[str, Any] = {}
SERIAL_LOCK = threading.Lock()

app = FastAPI(title="Hermes ESP32 Studio", version=APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _esptool_cmd() -> list[str]:
    """Return command prefix to invoke esptool reliably."""
    return [sys.executable, "-m", "esptool"]


def _has_esptool() -> bool:
    try:
        res = subprocess.run(
            [*_esptool_cmd(), "version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return res.returncode == 0
    except Exception:
        return False


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _parse_flash_size_bytes(size_str: str) -> str:
    """Map human flash size (4MB/8MB/16MB/ALL) to esptool size argument."""
    mapping = {
        "2MB": "0x200000",
        "4MB": "0x400000",
        "8MB": "0x800000",
        "16MB": "0x1000000",
        "32MB": "0x2000000",
        "ALL": "ALL",
    }
    return mapping.get(size_str.upper(), "ALL")


def _load_requirements() -> list[dict[str, Any]]:
    if not REQUIREMENTS_FILE.exists():
        return []
    try:
        return json.loads(REQUIREMENTS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_requirements(items: list[dict[str, Any]]) -> None:
    REQUIREMENTS_FILE.write_text(
        json.dumps(items, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _generate_starter_code(title: str, board: str, framework: str, description: str, version: str) -> str:
    safe_title = title.replace('"', "'")
    if framework == "ESP-IDF":
        return f'''/*
 * Project: {safe_title} ({version})
 * Target:  {board} | Framework: ESP-IDF (C)
 * Spec:    {description}
 */
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "driver/gpio.h"

static const char *TAG = "HERMES_APP";
#define STATUS_LED_GPIO GPIO_NUM_2

void app_main(void) {{
    ESP_LOGI(TAG, "Starting {safe_title} [{version}] on {board}");
    gpio_reset_pin(STATUS_LED_GPIO);
    gpio_set_direction(STATUS_LED_GPIO, GPIO_MODE_OUTPUT);

    while (1) {{
        gpio_set_level(STATUS_LED_GPIO, 1);
        ESP_LOGI(TAG, "Heartbeat OK — Ready for custom logic");
        vTaskDelay(pdMS_TO_TICKS(1000));
        gpio_set_level(STATUS_LED_GPIO, 0);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }}
}}
'''
    if framework == "MicroPython":
        return f'''# Project: {safe_title} ({version})
# Target:  {board} | Framework: MicroPython
# Spec:    {description}

import time
from machine import Pin

VERSION = "{version}"
led = Pin(2, Pin.OUT)

def main():
    print(f"[Hermes] Starting {safe_title} ({{VERSION}}) on {board}")
    while True:
        led.value(1)
        print("[Hermes] Heartbeat OK")
        time.sleep(1)
        led.value(0)
        time.sleep(1)

if __name__ == "__main__":
    main()
'''
    return f'''/*
 * Project: {safe_title} ({version})
 * Target:  {board} | Framework: Arduino-ESP32 (C++)
 * Spec:    {description}
 */
#include <Arduino.h>

#define APP_VERSION "{version}"
#define STATUS_LED_PIN 2

void setup() {{
  Serial.begin(115200);
  delay(200);
  pinMode(STATUS_LED_PIN, OUTPUT);
  Serial.println("========================================");
  Serial.print("Hermes Firmware: {safe_title} ");
  Serial.println(APP_VERSION);
  Serial.println("Target Board: {board}");
  Serial.println("========================================");
}}

void loop() {{
  digitalWrite(STATUS_LED_PIN, HIGH);
  Serial.println("[Heartbeat] ESP32 running custom task...");
  delay(1000);
  digitalWrite(STATUS_LED_PIN, LOW);
  delay(1000);
}}
'''


class ChipInfoRequest(BaseModel):
    port: str
    baud: int = 460800


class BackupRequest(BaseModel):
    port: str
    baud: int = 460800
    flash_size: str = "ALL"
    label: str = "factory-backup"
    version: str = "v1.0.0"
    notes: str = ""
    chip: str = "ESP32"


class RestoreRequest(BaseModel):
    port: str
    baud: int = 460800
    address: str = "0x0"


class SerialSendRequest(BaseModel):
    port: str
    data: str


class RequirementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    board: str = "ESP32-S3"
    category: str = "外设控制"
    framework: str = "Arduino"
    priority: str = "中"
    description: str = Field(..., min_length=1)
    sensors: list[str] = Field(default_factory=list)


class RequirementStatusUpdate(BaseModel):
    status: str


@app.get("/api/meta")
def get_meta() -> dict[str, Any]:
    return {
        "name": "Hermes ESP32 Studio",
        "version": APP_VERSION,
        "repo": GITHUB_REPO,
        "repoUrl": f"https://github.com/{GITHUB_REPO}",
        "platform": platform.system(),
        "python": platform.python_version(),
        "esptoolAvailable": _has_esptool(),
        "mode": "local-bridge",
    }


@app.get("/api/ports")
def list_serial_ports() -> dict[str, Any]:
    try:
        from serial.tools import list_ports
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=f"pyserial 未安装: {exc}") from exc

    ports = []
    for p in list_ports.comports():
        desc = p.description or ""
        is_esp_likely = any(
            kw in desc.upper()
            for kw in ("CH340", "CH341", "CP210", "USB-SERIAL", "JTAG", "ESP", "SILABS", "FTDI")
        )
        ports.append(
            {
                "device": p.device,
                "description": desc,
                "hwid": p.hwid or "",
                "manufacturer": p.manufacturer or "",
                "recommended": is_esp_likely,
            }
        )
    ports.sort(key=lambda x: (not x["recommended"], x["device"]))
    return {"ports": ports}


@app.post("/api/chip-info")
def detect_chip_info(req: ChipInfoRequest) -> dict[str, Any]:
    cmd = [*_esptool_cmd(), "--port", req.port, "--baud", str(req.baud), "flash_id"]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="连接开发板超时，请检查串口是否被占用，或按住 BOOT 键重试。") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    output = (proc.stdout or "") + "\n" + (proc.stderr or "")
    if proc.returncode != 0:
        raise HTTPException(status_code=400, detail=f"芯片识别失败:\n{output.strip()}")

    chip_match = re.search(r"Detecting chip type\.\.\.\s*(.+)", output) or re.search(r"Chip is\s+(.+)", output)
    mac_match = re.search(r"MAC:\s*([0-9a-fA-F:]+)", output)
    flash_match = re.search(r"Detected flash size:\s*(\S+)", output)
    crystal_match = re.search(r"Crystal is\s+(.+)", output)

    return {
        "port": req.port,
        "chip": chip_match.group(1).strip() if chip_match else "ESP32",
        "mac": mac_match.group(1).strip() if mac_match else "未知",
        "flashSize": flash_match.group(1).strip() if flash_match else "4MB",
        "crystal": crystal_match.group(1).strip() if crystal_match else "40MHz",
        "raw": output.strip(),
    }


def _run_esptool_task(
    task_id: str,
    cmd: list[str],
    on_success: Any = None,
) -> None:
    with TASKS_LOCK:
        TASKS[task_id]["status"] = "running"
        TASKS[task_id]["logs"].append(f"$ {' '.join(cmd)}")

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        assert proc.stdout is not None
        for raw_line in proc.stdout:
            line = raw_line.rstrip()
            if not line:
                continue
            pct_match = re.search(r"\((\d+)\s*%\)", line)
            with TASKS_LOCK:
                TASKS[task_id]["logs"].append(line)
                if len(TASKS[task_id]["logs"]) > 400:
                    TASKS[task_id]["logs"] = TASKS[task_id]["logs"][-400:]
                if pct_match:
                    TASKS[task_id]["progress"] = min(99, int(pct_match.group(1)))

        proc.wait()
        if proc.returncode == 0:
            result = on_success() if on_success else None
            with TASKS_LOCK:
                TASKS[task_id]["status"] = "completed"
                TASKS[task_id]["progress"] = 100
                TASKS[task_id]["result"] = result
                TASKS[task_id]["finishedAt"] = datetime.now(timezone.utc).isoformat()
        else:
            with TASKS_LOCK:
                TASKS[task_id]["status"] = "failed"
                TASKS[task_id]["error"] = f"esptool 退出码 {proc.returncode}"
                TASKS[task_id]["finishedAt"] = datetime.now(timezone.utc).isoformat()
    except Exception as exc:
        with TASKS_LOCK:
            TASKS[task_id]["status"] = "failed"
            TASKS[task_id]["error"] = str(exc)
            TASKS[task_id]["finishedAt"] = datetime.now(timezone.utc).isoformat()


@app.post("/api/backup")
def start_backup(req: BackupRequest) -> dict[str, Any]:
    task_id = uuid.uuid4().hex[:12]
    backup_id = f"bkp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{task_id[:6]}"
    safe_label = re.sub(r"[^a-zA-Z0-9_\-\u4e00-\u9fa5]", "_", req.label.strip()) or "backup"
    bin_name = f"{backup_id}_{safe_label}.bin"
    bin_path = BACKUPS_DIR / bin_name
    size_arg = _parse_flash_size_bytes(req.flash_size)

    cmd = [
        *_esptool_cmd(),
        "--port",
        req.port,
        "--baud",
        str(req.baud),
        "read_flash",
        "0x0",
        size_arg,
        str(bin_path),
    ]

    with TASKS_LOCK:
        TASKS[task_id] = {
            "id": task_id,
            "type": "backup",
            "status": "queued",
            "progress": 0,
            "logs": [],
            "error": None,
            "result": None,
            "startedAt": datetime.now(timezone.utc).isoformat(),
        }

    def finalize_backup() -> dict[str, Any]:
        meta = {
            "id": backup_id,
            "filename": bin_name,
            "label": req.label,
            "version": req.version,
            "chip": req.chip,
            "port": req.port,
            "flashSize": req.flash_size,
            "notes": req.notes,
            "sizeBytes": bin_path.stat().st_size if bin_path.exists() else 0,
            "sha256": _sha256_file(bin_path) if bin_path.exists() else "",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        (BACKUPS_DIR / f"{backup_id}.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return meta

    threading.Thread(target=_run_esptool_task, args=(task_id, cmd, finalize_backup), daemon=True).start()
    return {"taskId": task_id, "backupId": backup_id}


@app.get("/api/tasks/{task_id}")
def get_task(task_id: str) -> dict[str, Any]:
    with TASKS_LOCK:
        task = TASKS.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        return dict(task)


@app.get("/api/backups")
def list_backups() -> dict[str, Any]:
    items = []
    for meta_file in sorted(BACKUPS_DIR.glob("*.json"), reverse=True):
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            bin_path = BACKUPS_DIR / meta.get("filename", "")
            meta["exists"] = bin_path.exists()
            items.append(meta)
        except Exception:
            continue
    return {"backups": items}


@app.get("/api/backups/{backup_id}/download")
def download_backup(backup_id: str) -> FileResponse:
    meta_file = BACKUPS_DIR / f"{backup_id}.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="备份记录不存在")
    meta = json.loads(meta_file.read_text(encoding="utf-8"))
    bin_path = BACKUPS_DIR / meta["filename"]
    if not bin_path.exists():
        raise HTTPException(status_code=404, detail="备份二进制文件缺失")
    return FileResponse(path=bin_path, filename=meta["filename"], media_type="application/octet-stream")


@app.post("/api/backups/{backup_id}/restore")
def restore_backup(backup_id: str, req: RestoreRequest) -> dict[str, Any]:
    meta_file = BACKUPS_DIR / f"{backup_id}.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="备份记录不存在")
    meta = json.loads(meta_file.read_text(encoding="utf-8"))
    bin_path = BACKUPS_DIR / meta["filename"]
    if not bin_path.exists():
        raise HTTPException(status_code=404, detail="备份二进制文件缺失")

    task_id = uuid.uuid4().hex[:12]
    cmd = [
        *_esptool_cmd(),
        "--port",
        req.port,
        "--baud",
        str(req.baud),
        "write_flash",
        req.address,
        str(bin_path),
    ]
    with TASKS_LOCK:
        TASKS[task_id] = {
            "id": task_id,
            "type": "restore",
            "status": "queued",
            "progress": 0,
            "logs": [],
            "error": None,
            "result": None,
            "startedAt": datetime.now(timezone.utc).isoformat(),
        }

    threading.Thread(
        target=_run_esptool_task,
        args=(task_id, cmd, lambda: {"restoredBackupId": backup_id, "filename": meta["filename"]}),
        daemon=True,
    ).start()
    return {"taskId": task_id}


@app.delete("/api/backups/{backup_id}")
def delete_backup(backup_id: str) -> dict[str, Any]:
    meta_file = BACKUPS_DIR / f"{backup_id}.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="备份记录不存在")
    meta = json.loads(meta_file.read_text(encoding="utf-8"))
    bin_path = BACKUPS_DIR / meta.get("filename", "")
    if bin_path.exists():
        bin_path.unlink()
    meta_file.unlink()
    return {"deleted": backup_id}


@app.post("/api/flash")
async def flash_uploaded_firmware(
    port: str = Form(...),
    baud: int = Form(460800),
    address: str = Form("0x0"),
    file: UploadFile = File(...),
) -> dict[str, Any]:
    task_id = uuid.uuid4().hex[:12]
    tmp_path = DATA_DIR / f"upload_{task_id}_{file.filename or 'firmware.bin'}"
    with tmp_path.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    cmd = [
        *_esptool_cmd(),
        "--port",
        port,
        "--baud",
        str(baud),
        "write_flash",
        address,
        str(tmp_path),
    ]
    with TASKS_LOCK:
        TASKS[task_id] = {
            "id": task_id,
            "type": "flash",
            "status": "queued",
            "progress": 0,
            "logs": [],
            "error": None,
            "result": None,
            "startedAt": datetime.now(timezone.utc).isoformat(),
        }

    def cleanup() -> dict[str, Any]:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
        return {"filename": file.filename, "address": address}

    threading.Thread(target=_run_esptool_task, args=(task_id, cmd, cleanup), daemon=True).start()
    return {"taskId": task_id}


@app.get("/api/serial/stream")
def serial_stream(port: str = Query(...), baud: int = Query(115200)) -> StreamingResponse:
    try:
        import serial
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="pyserial 未安装") from exc

    q: queue.Queue[str] = queue.Queue()
    stop_event = threading.Event()

    with SERIAL_LOCK:
        old_stop = SERIAL_STOP_EVENTS.get(port)
        if old_stop:
            old_stop.set()
        SERIAL_STOP_EVENTS[port] = stop_event

    def reader() -> None:
        ser = None
        try:
            ser = serial.Serial(port=port, baudrate=baud, timeout=0.25)
            with SERIAL_LOCK:
                SERIAL_CONNECTIONS[port] = ser
            q.put(f"[系统] 已连接到 {port} ({baud} bps)")
            while not stop_event.is_set():
                line = ser.readline()
                if line:
                    text = line.decode("utf-8", errors="replace").rstrip("\r\n")
                    q.put(text)
        except Exception as exc:
            q.put(f"[错误] 串口连接中断: {exc}")
        finally:
            if ser and ser.is_open:
                ser.close()
            with SERIAL_LOCK:
                SERIAL_CONNECTIONS.pop(port, None)
            q.put("__EOF__")

    threading.Thread(target=reader, daemon=True).start()

    def event_gen():
        try:
            while True:
                try:
                    msg = q.get(timeout=1.0)
                    if msg == "__EOF__":
                        break
                    yield f"data: {json.dumps({'line': msg}, ensure_ascii=False)}\n\n"
                except queue.Empty:
                    yield ": keepalive\n\n"
        finally:
            stop_event.set()

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@app.post("/api/serial/send")
def serial_send(req: SerialSendRequest) -> dict[str, Any]:
    with SERIAL_LOCK:
        ser = SERIAL_CONNECTIONS.get(req.port)
    if not ser or not ser.is_open:
        raise HTTPException(status_code=400, detail=f"串口 {req.port} 未打开，请先点击「连接串口」")
    payload = (req.data + "\r\n").encode("utf-8")
    ser.write(payload)
    return {"sent": req.data}


@app.get("/api/requirements")
def list_requirements() -> dict[str, Any]:
    return {"requirements": _load_requirements()}


@app.post("/api/requirements")
def create_requirement(req: RequirementCreate) -> dict[str, Any]:
    items = _load_requirements()
    version = f"req-v{len(items) + 1}.0"
    item = {
        "id": uuid.uuid4().hex[:10],
        "version": version,
        "title": req.title.strip(),
        "board": req.board,
        "category": req.category,
        "framework": req.framework,
        "priority": req.priority,
        "description": req.description.strip(),
        "sensors": req.sensors,
        "status": "待实现",
        "starterCode": _generate_starter_code(req.title, req.board, req.framework, req.description, version),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    items.insert(0, item)
    _save_requirements(items)
    return {"requirement": item}


@app.patch("/api/requirements/{req_id}")
def update_requirement_status(req_id: str, body: RequirementStatusUpdate) -> dict[str, Any]:
    items = _load_requirements()
    for item in items:
        if item["id"] == req_id:
            item["status"] = body.status
            _save_requirements(items)
            return {"requirement": item}
    raise HTTPException(status_code=404, detail="需求不存在")


@app.delete("/api/requirements/{req_id}")
def delete_requirement(req_id: str) -> dict[str, Any]:
    items = _load_requirements()
    new_items = [i for i in items if i["id"] != req_id]
    if len(new_items) == len(items):
        raise HTTPException(status_code=404, detail="需求不存在")
    _save_requirements(new_items)
    return {"deleted": req_id}


@app.get("/api/github/apps")
def get_github_apps(q: str = Query(default="")) -> dict[str, Any]:
    query = q.strip()
    if not query:
        return {"source": "curated", "apps": CURATED_ESP32_APPS}

    api_url = (
        "https://api.github.com/search/repositories?"
        + urllib.parse.urlencode({"q": f"{query} esp32", "sort": "stars", "order": "desc", "per_page": 12})
    )
    req = urllib.request.Request(api_url, headers={"User-Agent": f"Hermes-ESP32-Studio/{APP_VERSION}"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        apps = [
            {
                "fullName": r["full_name"],
                "name": r["name"],
                "category": "GitHub 实时搜索",
                "language": r.get("language") or "C++",
                "stargazersCount": r.get("stargazers_count", 0),
                "updatedAt": r.get("updated_at", ""),
                "url": r["html_url"],
                "releasesUrl": f"{r['html_url']}/releases",
                "description": r.get("description") or "暂无简介",
                "recommendedFor": "ESP32 开源项目",
            }
            for r in payload.get("items", [])
        ]
        return {"source": "github-live", "apps": apps}
    except Exception as exc:
        return {"source": "fallback", "error": str(exc), "apps": CURATED_ESP32_APPS}


@app.get("/api/github/releases")
def get_github_releases() -> dict[str, Any]:
    api_url = f"https://api.github.com/repos/{GITHUB_REPO}/releases"
    req = urllib.request.Request(api_url, headers={"User-Agent": f"Hermes-ESP32-Studio/{APP_VERSION}"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            releases = json.loads(resp.read().decode("utf-8"))
        return {"repo": GITHUB_REPO, "releases": releases}
    except Exception as exc:
        return {"repo": GITHUB_REPO, "releases": [], "error": str(exc)}


if WEB_DIR.exists():
    app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="web")
