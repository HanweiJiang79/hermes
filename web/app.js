/* Hermes ESP32 Studio — Frontend Controller (v1.1.0)
 * Supports BOTH:
 *  1) Online GitHub Pages / Browser Web Serial + esptool-js (zero install, Chrome/Edge)
 *  2) Local Python FastAPI + esptool bridge (start.bat)
 */
(() => {
  const APP_VERSION = "1.2.1";
  const GITHUB_REPO = "HanweiJiang79/hermes";

  const FALLBACK_APPS = [
    {
      fullName: "78/xiaozhi-esp32",
      name: "xiaozhi-esp32",
      category: "AI 语音 / 小智",
      language: "C++",
      stargazersCount: 33577,
      updatedAt: "2026-11-22T02:38:40Z",
      url: "https://github.com/78/xiaozhi-esp32",
      releasesUrl: "https://github.com/78/xiaozhi-esp32/releases",
      description: "基于 MCP 协议的开源 AI 语音聊天机器人固件，支持 ESP32-S3 / 小智开发板、语音唤醒、大模型对话与外设控制。",
      recommendedFor: "小智开发板 / ESP32-S3",
    },
    {
      fullName: "xinnan-tech/xiaozhi-esp32-server",
      name: "xiaozhi-esp32-server",
      category: "AI 语音 / 小智",
      language: "JavaScript",
      stargazersCount: 11364,
      updatedAt: "2026-11-22T02:54:24Z",
      url: "https://github.com/xinnan-tech/xiaozhi-esp32-server",
      releasesUrl: "https://github.com/xinnan-tech/xiaozhi-esp32-server/releases",
      description: "xiaozhi-esp32 开源后端控制服务器，支持自定义 LLM、TTS/ASR、声纹与智能设备联动。",
      recommendedFor: "小智配套后端",
    },
    {
      fullName: "Maggotxy/xiaozhi-esp32-music",
      name: "xiaozhi-esp32-music",
      category: "AI 语音 / 小智",
      language: "C++",
      stargazersCount: 362,
      updatedAt: "2026-11-20T05:49:50Z",
      url: "https://github.com/Maggotxy/xiaozhi-esp32-music",
      releasesUrl: "https://github.com/Maggotxy/xiaozhi-esp32-music/releases",
      description: "小智 AI 机器人音乐播放增强固件，支持点歌、音频流解码与播放控制。",
      recommendedFor: "小智开发板 / 音频",
    },
    {
      fullName: "espressif/esp-idf",
      name: "esp-idf",
      category: "官方框架",
      language: "C",
      stargazersCount: 19565,
      updatedAt: "2026-11-22T01:48:13Z",
      url: "https://github.com/espressif/esp-idf",
      releasesUrl: "https://github.com/espressif/esp-idf/releases",
      description: "乐鑫官方 IoT 开发框架，提供全系列 ESP32 SoC 底层驱动、FreeRTOS、Wi-Fi/BLE 协议栈与烧录工具。",
      recommendedFor: "全系列 ESP32",
    },
    {
      fullName: "espressif/arduino-esp32",
      name: "arduino-esp32",
      category: "官方框架",
      language: "C++",
      stargazersCount: 17783,
      updatedAt: "2026-11-22T03:29:20Z",
      url: "https://github.com/espressif/arduino-esp32",
      releasesUrl: "https://github.com/espressif/arduino-esp32/releases",
      description: "乐鑫官方维护的 Arduino 核心库，生态丰富、上手极快，适合传感器测试与原型验证。",
      recommendedFor: "快速原型开发",
    },
    {
      fullName: "esphome/esphome",
      name: "esphome",
      category: "智能家居",
      language: "C++",
      stargazersCount: 12147,
      updatedAt: "2026-11-22T00:37:24Z",
      url: "https://github.com/esphome/esphome",
      releasesUrl: "https://github.com/esphome/esphome/releases",
      description: "通过 YAML 配置文件即可生成 ESP32 固件，无缝接入 Home Assistant 实现远程自动化控制。",
      recommendedFor: "智能家居 / HA",
    },
    {
      fullName: "arendst/Tasmota",
      name: "Tasmota",
      category: "智能家居",
      language: "C",
      stargazersCount: 25009,
      updatedAt: "2026-11-21T14:44:22Z",
      url: "https://github.com/arendst/Tasmota",
      releasesUrl: "https://github.com/arendst/Tasmota/releases",
      description: "开源全功能智能设备固件，自带 WebUI、OTA 升级、定时规则与 MQTT/HTTP 本地控制。",
      recommendedFor: "开关 / 传感器节点",
    },
    {
      fullName: "wled/WLED",
      name: "WLED",
      category: "智能家居",
      language: "C++",
      stargazersCount: 19098,
      updatedAt: "2026-11-21T19:19:38Z",
      url: "https://github.com/wled/WLED",
      releasesUrl: "https://github.com/wled/WLED/releases",
      description: "通过 Wi-Fi 控制 WS2812B 等数字 RGB 灯带的明星 ESP32 固件，内置百余种动态灯效与音频同步。",
      recommendedFor: "RGB 灯带 / 氛围灯",
    },
    {
      fullName: "lvgl/lvgl",
      name: "lvgl",
      category: "图形界面",
      language: "C",
      stargazersCount: 25221,
      updatedAt: "2026-11-22T03:16:38Z",
      url: "https://github.com/lvgl/lvgl",
      releasesUrl: "https://github.com/lvgl/lvgl/releases",
      description: "嵌入式领域最流行的开源图形界面库，完美适配 ESP32-S3 LCD/OLED 触摸屏与仪表盘开发。",
      recommendedFor: "带屏 ESP32 开发板",
    },
    {
      fullName: "meshtastic/firmware",
      name: "Meshtastic",
      category: "通信与极客",
      language: "C++",
      stargazersCount: 8619,
      updatedAt: "2026-11-21T21:02:05Z",
      url: "https://github.com/meshtastic/firmware",
      releasesUrl: "https://github.com/meshtastic/firmware/releases",
      description: "开源离网 LoRa Mesh 通信固件，无需基站即可实现远距离文本与位置加密通信。",
      recommendedFor: "LoRa / 离网通信",
    },
    {
      fullName: "justcallmekoko/ESP32Marauder",
      name: "ESP32Marauder",
      category: "通信与极客",
      language: "C++",
      stargazersCount: 13188,
      updatedAt: "2026-11-22T02:50:17Z",
      url: "https://github.com/justcallmekoko/ESP32Marauder",
      releasesUrl: "https://github.com/justcallmekoko/ESP32Marauder/releases",
      description: "ESP32 Wi-Fi / 蓝牙安全测试与频谱分析工具套件，常用于无线协议研究与渗透测试学习。",
      recommendedFor: "无线安全测试",
    },
    {
      fullName: "BruceDevices/firmware",
      name: "Bruce Firmware",
      category: "通信与极客",
      language: "C++",
      stargazersCount: 7354,
      updatedAt: "2026-11-22T03:32:13Z",
      url: "https://github.com/BruceDevices/firmware",
      releasesUrl: "https://github.com/BruceDevices/firmware/releases",
      description: "多合一 ESP32 极客便携固件，集成红外、射频、RFID、Wi-Fi、蓝牙及 WebUI 管理功能。",
      recommendedFor: "M5Stick / Cardputer / S3",
    },
  ];

  const state = {
    bridgeOnline: false,
    version: APP_VERSION,
    chip: "ESP32-S3",
    detectedFlashMB: 4,
    apps: [...FALLBACK_APPS],
    activeCategory: "全部",
    backups: [],
    requirements: [],
    serialConnected: false,
    eventSource: null,
    webSerialPort: null,
    webSerialReader: null,
    webSerialWriter: null,
    esptoolMod: null,
    selectedEspPort: null,
  };

  const $ = (id) => document.getElementById(id);

  // IndexedDB for storing real .bin firmware backups in Browser Web Serial mode
  const DB_NAME = "hermes_esp32_backups_v1";
  const STORE_NAME = "blobs";

  function openBackupDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveBlobToIDB(id, uint8Array) {
    const db = await openBackupDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(uint8Array, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadBlobFromIDB(id) {
    const db = await openBackupDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteBlobFromIDB(id) {
    const db = await openBackupDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadEsptoolJS() {
    if (state.esptoolMod) return state.esptoolMod;
    const urls = [
      "https://cdn.jsdelivr.net/npm/esptool-js@0.7.1/bundle.js",
      "https://unpkg.com/esptool-js@0.7.1/bundle.js",
    ];
    let lastErr;
    for (const url of urls) {
      try {
        state.esptoolMod = await import(url);
        return state.esptoolMod;
      } catch (err) {
        lastErr = err;
      }
    }
    throw new Error(`无法加载浏览器 esptool-js 组件: ${lastErr?.message || "网络受限"}`);
  }

  async function computeSha256Hex(uint8Array) {
    const hashBuf = await crypto.subtle.digest("SHA-256", uint8Array);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function triggerDownloadBlob(uint8Array, filename) {
    const blob = new Blob([uint8Array], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function flashSizeToBytes(sizeStr) {
    const map = {
      "2MB": 2 * 1024 * 1024,
      "4MB": 4 * 1024 * 1024,
      "8MB": 8 * 1024 * 1024,
      "16MB": 16 * 1024 * 1024,
      "32MB": 32 * 1024 * 1024,
    };
    if (sizeStr === "ALL") {
      return (state.detectedFlashMB || 4) * 1024 * 1024;
    }
    return map[sizeStr] || 4 * 1024 * 1024;
  }

  function showToast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }

  function formatStars(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("zh-CN", { hour12: false });
  }

  function appendConsole(elId, line) {
    const el = $(elId);
    el.textContent += (el.textContent ? "\n" : "") + line;
    el.scrollTop = el.scrollHeight;
  }

  function setProgress(label, pct, visible = true) {
    const wrap = $("taskProgressWrap");
    wrap.classList.toggle("visible", visible);
    $("taskProgressLabel").textContent = label;
    $("taskProgressPct").textContent = `${pct}%`;
    $("taskProgressFill").style.width = `${pct}%`;
  }

  function makeEsptoolTerminal() {
    return {
      clean: () => {
        $("esptoolConsole").textContent = "";
      },
      writeLine: (data) => appendConsole("esptoolConsole", String(data)),
      write: (data) => {
        const el = $("esptoolConsole");
        el.textContent += String(data);
        el.scrollTop = el.scrollHeight;
      },
    };
  }

  // Common USB-to-Serial vendor IDs for ESP32 boards (defaults browser picker to USB ports)
  const ESP32_USB_FILTERS = [
    { usbVendorId: 0x1a86 }, // WCH CH340 / CH341 / CH9102 (USB Single Serial)
    { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
    { usbVendorId: 0x303a }, // Espressif native USB JTAG/Serial (ESP32-S3/C3/C6)
    { usbVendorId: 0x0403 }, // FTDI
  ];

  function formatUsbPortLabel(port) {
    const info = port?.getInfo ? port.getInfo() : {};
    const vidMap = { 0x1a86: "USB Single Serial (CH34x)", 0x10c4: "USB CP210x", 0x303a: "ESP32 USB JTAG/Serial", 0x0403: "USB FTDI" };
    if (info.usbVendorId && vidMap[info.usbVendorId]) {
      return `${vidMap[info.usbVendorId]} [已默认绑定]`;
    }
    if (info.usbVendorId) {
      return `USB 串口 (VID:0x${info.usbVendorId.toString(16)})`;
    }
    return "USB 串口（Web Serial）";
  }

  function applySelectedUsbPort(port) {
    state.selectedEspPort = port;
    const label = formatUsbPortLabel(port);
    $("portSelect").innerHTML = `<option value="WebSerial">${label}</option>`;
    $("metricPort").textContent = label;
  }

  async function requestUsbSerialPort() {
    try {
      return await navigator.serial.requestPort({ filters: ESP32_USB_FILTERS });
    } catch (err) {
      if (err.name === "NotFoundError") throw err;
      return await navigator.serial.requestPort();
    }
  }

  async function restoreAuthorizedUsbPort() {
    if (!("serial" in navigator)) return;
    try {
      const ports = await navigator.serial.getPorts();
      if (!ports.length) return;
      const usbPort = ports.find((p) => {
        const vid = p.getInfo()?.usbVendorId;
        return vid && ESP32_USB_FILTERS.some((f) => f.usbVendorId === vid);
      }) || ports[0];
      applySelectedUsbPort(usbPort);
    } catch {}
  }

  async function ensureWebSerialEspPort() {
    if (!("serial" in navigator)) {
      throw new Error("当前浏览器不支持 Web Serial API，请使用最新版 Chrome 或 Edge 浏览器打开本页面。");
    }
    if (state.serialConnected) {
      await disconnectSerial();
    }
    if (!state.selectedEspPort) {
      await restoreAuthorizedUsbPort();
    }
    if (!state.selectedEspPort) {
      const port = await requestUsbSerialPort();
      applySelectedUsbPort(port);
    }
    return state.selectedEspPort;
  }

  async function withWebEsploader(baud, fn) {
    const { ESPLoader, Transport } = await loadEsptoolJS();
    const port = await ensureWebSerialEspPort();
    const transport = new Transport(port, true);
    const loader = new ESPLoader({
      transport,
      baudrate: baud,
      romBaudrate: 115200,
      terminal: makeEsptoolTerminal(),
    });
    try {
      const chip = await loader.main();
      state.chip = chip || "ESP32";
      return await fn(loader, chip);
    } finally {
      try {
        await transport.disconnect();
      } catch {}
    }
  }

  // Navigation Tabs
  function switchTab(tabName) {
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("active", view.id === `view-${tabName}`);
    });
  }

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Detect Local Bridge vs Online Web Serial Mode
  async function initBridge() {
    const chip = $("modeStatusChip");
    const txt = $("modeStatusText");
    const banner = $("modeBanner");
    const bannerText = $("modeBannerText");

    try {
      const res = await fetch("/api/meta", { signal: AbortSignal.timeout(1200) });
      if (!res.ok) throw new Error("not ok");
      const meta = await res.json();
      state.bridgeOnline = true;
      state.version = meta.version || APP_VERSION;
      $("appVersionBadge").textContent = `v${state.version}`;
      $("releaseCurrentVer").textContent = `v${state.version}`;
      $("footerVersion").textContent = `v${state.version}`;

      chip.className = "status-chip connected";
      txt.textContent = `本地桥接已就绪 (${meta.platform})`;
      banner.style.display = "none";

      await Promise.all([loadPorts(), loadBackups(), loadRequirements(), loadApps(), loadReleases()]);
    } catch {
      state.bridgeOnline = false;
      chip.className = "status-chip connected";
      txt.textContent = "在线 USB 串口直连模式";
      banner.style.display = "flex";
      bannerText.innerHTML =
        "<strong>已就绪（USB 串口直连）</strong>：默认筛选 ESP32 USB 串口（CH340/CP210x/ESP32-S3）。首次点击「允许」授权后，后续打开页面将自动默认记住该 USB 端口，无需重复选择。";

      await restoreAuthorizedUsbPort();
      loadBrowserSavedData();
      renderApps();
      loadReleases();
    }
  }

  function loadBrowserSavedData() {
    try {
      state.backups = JSON.parse(localStorage.getItem("hermes_web_backups") || "[]");
      state.requirements = JSON.parse(localStorage.getItem("hermes_web_reqs") || "[]");
    } catch {
      state.backups = [];
      state.requirements = [];
    }
    renderBackups();
    renderRequirements();
  }

  function saveBrowserData() {
    localStorage.setItem("hermes_web_backups", JSON.stringify(state.backups));
    localStorage.setItem("hermes_web_reqs", JSON.stringify(state.requirements));
  }

  // Ports & Chip Detection
  async function loadPorts() {
    if (!state.bridgeOnline) {
      if (!("serial" in navigator)) {
        showToast("请使用 Chrome / Edge 浏览器连接 USB 串口");
        return;
      }
      try {
        const port = await requestUsbSerialPort();
        applySelectedUsbPort(port);
        showToast("已绑定 USB 串口，后续将自动默认连接该端口");
      } catch (err) {
        if (err.name !== "NotFoundError") showToast(`选择串口失败: ${err.message}`);
      }
      return;
    }
    try {
      const res = await fetch("/api/ports");
      const data = await res.json();
      const select = $("portSelect");
      select.innerHTML = "";
      if (!data.ports.length) {
        select.innerHTML = `<option value="COM5">未检测到串口（默认 COM5）</option>`;
        return;
      }
      data.ports.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.device;
        opt.textContent = `${p.device} — ${p.description}${p.recommended ? "（推荐）" : ""}`;
        select.appendChild(opt);
      });
      $("metricPort").textContent = select.value;
      showToast(`已发现 ${data.ports.length} 个串口设备`);
    } catch (err) {
      showToast(`刷新串口失败: ${err.message}`);
    }
  }

  $("portSelect").addEventListener("change", () => {
    $("metricPort").textContent = $("portSelect").value;
  });

  $("btnRefreshPorts").addEventListener("click", loadPorts);

  $("btnDetectChip").addEventListener("click", async () => {
    const port = $("portSelect").value;
    const baud = Number($("baudSelect").value);
    $("esptoolConsole").textContent = `[检测] 正在连接 ESP32 芯片 (${baud} bps)...`;

    if (!state.bridgeOnline) {
      try {
        await withWebEsploader(baud, async (loader, chip) => {
          let flashMB = 4;
          try {
            const flashId = await loader.flashId();
            const sizeCode = (flashId >> 16) & 0xff;
            const sizeMap = { 0x15: 2, 0x16: 4, 0x17: 8, 0x18: 16, 0x19: 32 };
            if (sizeMap[sizeCode]) flashMB = sizeMap[sizeCode];
          } catch {}
          state.detectedFlashMB = flashMB;

          let mac = "已连接";
          try {
            if (loader.chip && typeof loader.chip.readMac === "function") {
              mac = await loader.chip.readMac(loader);
            }
          } catch {}

          $("metricChip").textContent = chip || "ESP32";
          $("metricFlash").textContent = `${flashMB}MB`;
          $("metricMac").textContent = mac;
          $("metricPort").textContent = "Web Serial (COM)";
          appendConsole("esptoolConsole", `\n[成功] 识别到芯片: ${chip} | Flash: ${flashMB}MB | MAC: ${mac}`);
          showToast(`识别成功: ${chip} (${flashMB}MB)`);
        });
      } catch (err) {
        appendConsole("esptoolConsole", `\n[错误] ${err.message}`);
        showToast("连接失败：请确认已选择 COM5，若仍失败可按住板子 BOOT 键再点检测");
      }
      return;
    }

    try {
      const res = await fetch("/api/chip-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port, baud }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "检测失败");

      state.chip = data.chip;
      $("metricChip").textContent = data.chip;
      $("metricFlash").textContent = data.flashSize;
      $("metricMac").textContent = data.mac;
      $("metricPort").textContent = data.port;
      appendConsole("esptoolConsole", data.raw);
      showToast(`识别成功: ${data.chip} (${data.flashSize})`);
    } catch (err) {
      appendConsole("esptoolConsole", `[错误] ${err.message}`);
      showToast("芯片识别失败，请查看终端日志");
    }
  });

  // Task Poller (Local Bridge Backup / Restore / Flash)
  async function pollTask(taskId, label) {
    setProgress(`${label} 进行中...`, 5, true);
    let lastLogLen = 0;

    while (true) {
      await new Promise((r) => setTimeout(r, 600));
      const res = await fetch(`/api/tasks/${taskId}`);
      const task = await res.json();

      if (task.logs && task.logs.length > lastLogLen) {
        task.logs.slice(lastLogLen).forEach((l) => appendConsole("esptoolConsole", l));
        lastLogLen = task.logs.length;
      }
      setProgress(`${label} (${task.status})`, task.progress || 0, true);

      if (task.status === "completed") {
        setProgress(`${label} 完成`, 100, true);
        showToast(`${label} 成功完成`);
        await loadBackups();
        return task;
      }
      if (task.status === "failed") {
        appendConsole("esptoolConsole", `[失败] ${task.error || "执行异常"}`);
        showToast(`${label} 失败，请检查日志`);
        return task;
      }
    }
  }

  // Backup Original Firmware
  $("btnStartBackup").addEventListener("click", async () => {
    const port = $("portSelect").value;
    const baud = Number($("baudSelect").value);
    const flash_size = $("flashSizeSelect").value;
    const label = $("backupLabel").value.trim() || "factory-backup";
    const version = $("backupVersion").value.trim() || "v1.1.0";
    const notes = $("backupNotes").value.trim();

    $("esptoolConsole").textContent = `[备份] 开始读取原始 Flash (${flash_size})...`;

    if (!state.bridgeOnline) {
      try {
        setProgress("连接开发板准备读取...", 2, true);
        await withWebEsploader(baud, async (loader, chip) => {
          let readBytes = flashSizeToBytes(flash_size);
          if (flash_size === "ALL") {
            try {
              const flashId = await loader.flashId();
              const sizeCode = (flashId >> 16) & 0xff;
              const sizeMap = { 0x15: 2, 0x16: 4, 0x17: 8, 0x18: 16, 0x19: 32 };
              if (sizeMap[sizeCode]) {
                state.detectedFlashMB = sizeMap[sizeCode];
                readBytes = state.detectedFlashMB * 1024 * 1024;
              }
            } catch {}
          }
          appendConsole("esptoolConsole", `\n[读取] 目标容量 ${formatBytes(readBytes)}，请保持 USB 连接不要拔出...`);
          let received = 0;
          const data = await loader.readFlash(0x0, readBytes, (packet) => {
            received += packet.length;
            const pct = Math.min(99, Math.round((received / readBytes) * 100));
            setProgress(`正在读取原始 Flash (${formatBytes(received)} / ${formatBytes(readBytes)})`, pct, true);
          });

          const sha256 = await computeSha256Hex(data);
          const id = `bkp_${Date.now()}`;
          const safeLabel = label.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, "_");
          const filename = `${id}_${safeLabel}.bin`;
          await saveBlobToIDB(id, data);

          state.backups.unshift({
            id,
            filename,
            label,
            version,
            chip: chip || state.chip,
            port: "Web Serial",
            flashSize: `${Math.round(readBytes / 1048576)}MB`,
            notes,
            sizeBytes: data.length,
            sha256,
            createdAt: new Date().toISOString(),
          });
          saveBrowserData();
          renderBackups();
          setProgress("读取并备份完成！", 100, true);
          appendConsole("esptoolConsole", `\n[完成] 已保存备份 ${filename} (SHA-256: ${sha256.slice(0, 16)}...)`);
          triggerDownloadBlob(data, filename);
          showToast("原始固件备份成功并已开始下载 .bin！");
        });
      } catch (err) {
        appendConsole("esptoolConsole", `\n[错误] ${err.message}`);
        showToast(`备份失败: ${err.message}`);
      }
      return;
    }

    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port, baud, flash_size, label, version, notes, chip: state.chip }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "启动备份失败");
      await pollTask(data.taskId, "读取并备份原始固件");
    } catch (err) {
      appendConsole("esptoolConsole", `[错误] ${err.message}`);
      showToast(err.message);
    }
  });

  // Backups List, Download, Restore, Delete
  async function loadBackups() {
    if (!state.bridgeOnline) {
      renderBackups();
      return;
    }
    try {
      const res = await fetch("/api/backups");
      const data = await res.json();
      state.backups = data.backups || [];
      renderBackups();
    } catch (err) {
      showToast(`加载备份失败: ${err.message}`);
    }
  }

  function renderBackups() {
    const tbody = $("backupsTableBody");
    if (!state.backups.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">暂无备份档案，点击上方「读取并备份原始固件」创建第一份原厂备份。</td></tr>`;
      return;
    }
    tbody.innerHTML = state.backups
      .map(
        (b) => `
      <tr>
        <td>
          <strong>${escapeHtml(b.label)}</strong>
          <span class="tag tag-accent mono" style="margin-left:6px;">${escapeHtml(b.version || "v1.1.0")}</span>
          ${b.notes ? `<div style="font-size:12px;color:var(--ink-muted);margin-top:2px;">${escapeHtml(b.notes)}</div>` : ""}
        </td>
        <td><span class="mono">${escapeHtml(b.chip || "ESP32")}</span> · ${escapeHtml(b.flashSize || "ALL")}</td>
        <td class="mono">${formatBytes(b.sizeBytes)}</td>
        <td class="mono" title="${escapeHtml(b.sha256 || "")}">${escapeHtml((b.sha256 || "").slice(0, 12) || "-")}</td>
        <td style="font-size:12px;color:var(--ink-secondary);">${formatDate(b.createdAt)}</td>
        <td>
          <div class="btn-row">
            <button class="btn btn-sm" data-action="download" data-id="${escapeHtml(b.id)}">下载 .bin</button>
            <button class="btn btn-sm btn-primary" data-action="restore" data-id="${escapeHtml(b.id)}">恢复到板卡</button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${escapeHtml(b.id)}">删除</button>
          </div>
        </td>
      </tr>`
      )
      .join("");
  }

  async function flashUint8ArrayViaWebSerial(uint8Array, addressNum, baud, label) {
    setProgress(`准备写入 ${label}...`, 2, true);
    await withWebEsploader(baud, async (loader) => {
      await loader.writeFlash({
        fileArray: [{ data: uint8Array, address: addressNum }],
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (_idx, written, total) => {
          const pct = Math.min(99, Math.round((written / total) * 100));
          setProgress(`正在写入 ${label} (${pct}%)`, pct, true);
        },
      });
      await loader.after();
      setProgress(`${label} 烧录完成！`, 100, true);
      appendConsole("esptoolConsole", `\n[成功] ${label} 已写入完成并重启开发板。`);
      showToast(`${label} 烧录成功！`);
    });
  }

  $("backupsTableBody").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    const bkp = state.backups.find((b) => b.id === id);

    if (action === "download") {
      if (!state.bridgeOnline) {
        const blob = await loadBlobFromIDB(id);
        if (!blob) {
          showToast("浏览器本地缓存中未找到该 .bin 文件");
          return;
        }
        triggerDownloadBlob(blob, bkp?.filename || `${id}.bin`);
        return;
      }
      window.location.href = `/api/backups/${encodeURIComponent(id)}/download`;
      return;
    }

    if (action === "restore") {
      const port = $("portSelect").value;
      const baud = Number($("baudSelect").value);
      if (!confirm("确定要将该备份恢复到开发板吗？这会覆盖当前 Flash 内容。")) return;

      $("esptoolConsole").textContent = `[恢复] 正在写入备份 ${bkp?.filename || id}...`;
      if (!state.bridgeOnline) {
        try {
          const blob = await loadBlobFromIDB(id);
          if (!blob) throw new Error("未找到备份二进制数据，请重新上传本地 .bin 烧录");
          await flashUint8ArrayViaWebSerial(blob, 0x0, baud, bkp?.filename || "原始备份");
        } catch (err) {
          appendConsole("esptoolConsole", `\n[错误] ${err.message}`);
          showToast(`恢复失败: ${err.message}`);
        }
        return;
      }

      try {
        const res = await fetch(`/api/backups/${encodeURIComponent(id)}/restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ port, baud, address: "0x0" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "启动恢复失败");
        await pollTask(data.taskId, "恢复原始固件");
      } catch (err) {
        appendConsole("esptoolConsole", `[错误] ${err.message}`);
        showToast(err.message);
      }
      return;
    }

    if (action === "delete") {
      if (!confirm("确定删除这条备份档案吗？")) return;
      if (!state.bridgeOnline) {
        state.backups = state.backups.filter((b) => b.id !== id);
        saveBrowserData();
        await deleteBlobFromIDB(id);
        renderBackups();
        showToast("已删除备份档案");
        return;
      }
      await fetch(`/api/backups/${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadBackups();
      showToast("已删除备份档案");
    }
  });

  $("btnReloadBackups").addEventListener("click", loadBackups);

  // Flash Uploaded .bin
  $("btnFlashFile").addEventListener("click", async () => {
    const fileInput = $("flashFileInput");
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      showToast("请先选择一个 .bin 固件文件");
      return;
    }
    const port = $("portSelect").value;
    const baud = Number($("baudSelect").value);
    const addressStr = $("flashAddrInput").value.trim() || "0x0";

    if (!state.bridgeOnline) {
      try {
        const buf = new Uint8Array(await file.arrayBuffer());
        const addrNum = parseInt(addressStr, 16) || 0;
        $("esptoolConsole").textContent = `[烧录] 正在通过 Web Serial 写入 ${file.name} 至 0x${addrNum.toString(16)}...`;
        await flashUint8ArrayViaWebSerial(buf, addrNum, baud, file.name);
      } catch (err) {
        appendConsole("esptoolConsole", `\n[错误] ${err.message}`);
        showToast(`烧录失败: ${err.message}`);
      }
      return;
    }

    const fd = new FormData();
    fd.append("port", port);
    fd.append("baud", String(baud));
    fd.append("address", addressStr);
    fd.append("file", file);

    $("esptoolConsole").textContent = `[烧录] 正在上传并写入 ${file.name} 至 ${port} (${addressStr})...`;
    try {
      const res = await fetch("/api/flash", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "烧录启动失败");
      await pollTask(data.taskId, `烧录 ${file.name}`);
    } catch (err) {
      appendConsole("esptoolConsole", `[错误] ${err.message}`);
      showToast(err.message);
    }
  });

  // Serial Monitor (Local SSE Bridge OR Browser Web Serial API)
  async function disconnectSerial() {
    if (state.eventSource) {
      state.eventSource.close();
      state.eventSource = null;
    }
    if (state.webSerialReader) {
      try {
        await state.webSerialReader.cancel();
      } catch {}
      state.webSerialReader = null;
    }
    if (state.webSerialWriter) {
      try {
        state.webSerialWriter.releaseLock();
      } catch {}
      state.webSerialWriter = null;
    }
    if (state.webSerialPort) {
      try {
        await state.webSerialPort.close();
      } catch {}
      state.webSerialPort = null;
    }
    state.serialConnected = false;
    $("btnSerialToggle").textContent = "连接串口监视器";
    appendConsole("serialConsole", "[系统] 串口已断开");
  }

  async function connectWebSerial() {
    if (!("serial" in navigator)) {
      showToast("当前浏览器不支持 Web Serial，请使用最新版 Chrome 或 Edge");
      return;
    }
    try {
      const baudRate = Number($("serialBaudSelect").value);
      const port = state.selectedEspPort || (await requestUsbSerialPort());
      applySelectedUsbPort(port);
      await port.open({ baudRate });
      state.webSerialPort = port;
      state.serialConnected = true;
      $("btnSerialToggle").textContent = "断开串口";
      appendConsole("serialConsole", `[Web Serial] 已直接连接串口 (${baudRate} bps)`);

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      state.webSerialReader = reader;

      const encoder = new TextEncoderStream();
      encoder.readable.pipeTo(port.writable);
      state.webSerialWriter = encoder.writable.getWriter();

      while (state.serialConnected) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) appendConsole("serialConsole", value.replace(/\r?\n$/, ""));
      }
    } catch (err) {
      appendConsole("serialConsole", `[Web Serial] ${err.message}`);
      await disconnectSerial();
    }
  }

  $("btnWebSerialQuick").addEventListener("click", () => {
    switchTab("device");
    loadPorts();
  });

  $("btnSerialToggle").addEventListener("click", async () => {
    if (state.serialConnected) {
      await disconnectSerial();
      return;
    }
    if (!state.bridgeOnline) {
      await connectWebSerial();
      return;
    }

    const port = $("portSelect").value;
    const baud = $("serialBaudSelect").value;
    const es = new EventSource(`/api/serial/stream?port=${encodeURIComponent(port)}&baud=${encodeURIComponent(baud)}`);
    state.eventSource = es;
    state.serialConnected = true;
    $("btnSerialToggle").textContent = "断开串口";

    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        appendConsole("serialConsole", payload.line);
      } catch {
        appendConsole("serialConsole", ev.data);
      }
    };
    es.onerror = () => {
      appendConsole("serialConsole", "[系统] 串口流已关闭");
      disconnectSerial();
    };
  });

  $("btnSerialClear").addEventListener("click", () => {
    $("serialConsole").textContent = "";
  });

  async function sendSerialCommand() {
    const input = $("serialSendInput");
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = "";

    if (state.webSerialWriter) {
      await state.webSerialWriter.write(cmd + "\r\n");
      appendConsole("serialConsole", `> ${cmd}`);
      return;
    }
    if (!state.bridgeOnline) {
      showToast("请先连接串口监视器");
      return;
    }
    const port = $("portSelect").value;
    const res = await fetch("/api/serial/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ port, data: cmd }),
    });
    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || "发送失败");
      return;
    }
    appendConsole("serialConsole", `> ${cmd}`);
  }

  $("btnSerialSend").addEventListener("click", sendSerialCommand);
  $("serialSendInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendSerialCommand();
  });

  // Feature Studio (Recommended Sensors + Requirements)
  const RECOMMENDED_SENSORS = [
    { id: "AHT20", name: "AHT20 / SHT30", desc: "温湿度监测", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "BME280", name: "BME280", desc: "温湿度 + 气压", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "BH1750", name: "BH1750", desc: "环境光照强度", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "SGP30", name: "SGP30", desc: "CO₂ / 空气质量", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "LD2410", name: "LD2410 雷达", desc: "24GHz 人体存在", bus: "UART", pin: "TX→GPIO18, RX→GPIO17, 5V/GND" },
    { id: "HC-SR501", name: "HC-SR501", desc: "热释电人体红外", bus: "GPIO", pin: "OUT→GPIO4, 3V3/5V, GND" },
    { id: "VL53L0X", name: "VL53L0X", desc: "激光 ToF 测距", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "MPU6050", name: "MPU6050", desc: "六轴姿态 / 陀螺仪", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "INMP441", name: "INMP441", desc: "I2S 数字麦克风", bus: "I2S", pin: "SCK→GPIO5, WS→GPIO6, SD→GPIO7" },
    { id: "OV2640", name: "OV2640", desc: "ESP32-S3 摄像头", bus: "DVP", pin: "接板载 FPC 摄像头座" },
    { id: "MAX30102", name: "MAX30102", desc: "心率 / 血氧检测", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "SSD1306", name: "SSD1306 OLED", desc: "0.96 寸屏幕显示", bus: "I2C", pin: "SDA→GPIO8, SCL→GPIO9, 3V3/GND" },
    { id: "WS2812B", name: "WS2812B 彩灯", desc: "可编程 RGB 灯珠", bus: "GPIO", pin: "DIN→GPIO48, 3V3/5V, GND" },
    { id: "PN532", name: "PN532 / RC522", desc: "NFC / RFID 刷卡", bus: "I2C/SPI", pin: "SDA→GPIO8, SCL→GPIO9 (I2C模式)" },
  ];

  const selectedSensors = new Set();

  function renderSensorSelector() {
    const grid = $("sensorGrid");
    if (!grid) return;
    grid.innerHTML = RECOMMENDED_SENSORS.map((s) => {
      const checked = selectedSensors.has(s.id);
      return `
        <label class="sensor-option ${checked ? "selected" : ""}" data-sensor-id="${escapeHtml(s.id)}">
          <input type="checkbox" value="${escapeHtml(s.id)}" ${checked ? "checked" : ""} />
          <div class="sensor-info">
            <div class="sensor-name">${escapeHtml(s.name)}</div>
            <div class="sensor-meta">${escapeHtml(s.desc)} · <span class="mono">${escapeHtml(s.bus)}</span></div>
          </div>
        </label>`;
    }).join("");
    updateSensorWiringHint();
  }

  function updateSensorWiringHint() {
    const countEl = $("selectedSensorCount");
    const box = $("sensorWiringBox");
    if (countEl) countEl.textContent = `已选 ${selectedSensors.size} 个传感器`;
    if (!box) return;
    if (!selectedSensors.size) {
      box.classList.remove("visible");
      box.innerHTML = "";
      return;
    }
    const chosen = RECOMMENDED_SENSORS.filter((s) => selectedSensors.has(s.id));
    const lines = chosen.map((s) => `• <strong>${escapeHtml(s.name)}</strong>（${escapeHtml(s.bus)}）：<code>${escapeHtml(s.pin)}</code>`);
    box.innerHTML = `<div style="font-weight:600;color:var(--ink);margin-bottom:4px;">推荐参考接线（ESP32-S3，多个 I2C 传感器可并联共用同一组 SDA/SCL）：</div>${lines.join("<br>")}`;
    box.classList.add("visible");
  }

  if ($("sensorGrid")) {
    $("sensorGrid").addEventListener("change", (e) => {
      const cb = e.target.closest('input[type="checkbox"]');
      if (!cb) return;
      if (cb.checked) selectedSensors.add(cb.value);
      else selectedSensors.delete(cb.value);
      const card = cb.closest(".sensor-option");
      if (card) card.classList.toggle("selected", cb.checked);
      updateSensorWiringHint();
    });
  }

  if ($("btnClearSensors")) {
    $("btnClearSensors").addEventListener("click", () => {
      selectedSensors.clear();
      renderSensorSelector();
    });
  }

  function buildClientStarterCode(title, board, framework, description, version, sensors = []) {
    const chosen = RECOMMENDED_SENSORS.filter((s) => sensors.includes(s.id));
    const sensorSummary = chosen.length ? chosen.map((s) => `${s.name}(${s.bus})`).join(", ") : "无外接传感器";
    const hasI2C = chosen.some((s) => s.bus.includes("I2C"));

    if (framework === "ESP-IDF") {
      const wiringComments = chosen.map((s) => ` *   - ${s.name}: ${s.pin}`).join("\n");
      return `/*\n * Project: ${title} (${version}) | Target: ${board} | ESP-IDF\n * Sensors: ${sensorSummary}\n${wiringComments ? wiringComments + "\n" : ""} * Spec:    ${description}\n */\n#include <stdio.h>\n#include "freertos/FreeRTOS.h"\n#include "freertos/task.h"\n#include "esp_log.h"\n${hasI2C ? '#include "driver/i2c.h"\n' : ""}\nstatic const char *TAG = "HERMES_APP";\n\nvoid app_main(void) {\n    ESP_LOGI(TAG, "Starting ${title} [${version}] on ${board}");\n    ESP_LOGI(TAG, "Sensors: ${sensorSummary}");\n    while (1) {\n        ESP_LOGI(TAG, "Sampling sensors & heartbeat OK");\n        vTaskDelay(pdMS_TO_TICKS(1000));\n    }\n}`;
    }
    if (framework === "MicroPython") {
      const i2cInit = hasI2C ? "from machine import I2C\ni2c = I2C(0, scl=Pin(9), sda=Pin(8), freq=400000)\nprint('[I2C] Found devices:', [hex(a) for a in i2c.scan()])\n" : "";
      return `# Project: ${title} (${version}) | Target: ${board} | MicroPython\n# Sensors: ${sensorSummary}\n# Spec: ${description}\nimport time\nfrom machine import Pin\n\nled = Pin(2, Pin.OUT)\n${i2cInit}print("[Hermes] Starting ${title} (${version})")\nwhile True:\n    led.value(1)\n    time.sleep(1)\n    led.value(0)\n    time.sleep(1)`;
    }
    const wiringComments = chosen.map((s) => ` *   - ${s.name}: ${s.pin}`).join("\n");
    const i2cHeader = hasI2C ? "#include <Wire.h>\n#define I2C_SDA 8\n#define I2C_SCL 9\n" : "";
    const i2cSetup = hasI2C ? '  Wire.begin(I2C_SDA, I2C_SCL);\n  Serial.println("[I2C] Bus initialized on GPIO8/GPIO9");\n' : "";
    return `/*\n * Project: ${title} (${version}) | Target: ${board} | Arduino-ESP32\n * Sensors: ${sensorSummary}\n${wiringComments ? wiringComments + "\n" : ""} * Spec:    ${description}\n */\n#include <Arduino.h>\n${i2cHeader}#define APP_VERSION "${version}"\n\nvoid setup() {\n  Serial.begin(115200);\n  delay(200);\n  Serial.println("Hermes App: ${title} " APP_VERSION);\n  Serial.println("Sensors: ${sensorSummary}");\n${i2cSetup}}\n\nvoid loop() {\n  Serial.println("[Heartbeat] Running on ${board}");\n  delay(1000);\n}`;
  }

  async function loadRequirements() {
    if (!state.bridgeOnline) {
      renderRequirements();
      return;
    }
    try {
      const res = await fetch("/api/requirements");
      const data = await res.json();
      state.requirements = data.requirements || [];
      renderRequirements();
    } catch {}
  }

  function renderRequirements() {
    const list = $("reqList");
    $("reqCountTag").textContent = `${state.requirements.length} 条需求`;
    if (!state.requirements.length) {
      list.innerHTML = `<div class="empty-state">还没有录入需求，请在上方输入想在 ESP32 上实现的功能。</div>`;
      return;
    }

    list.innerHTML = state.requirements
      .map((r) => {
        const sensorList = Array.isArray(r.sensors) ? r.sensors : [];
        const sensorsMd = sensorList.length ? sensorList.join(", ") : "无";
        const issueTitle = encodeURIComponent(`[ESP32 需求 ${r.version}] ${r.title}`);
        const issueBody = encodeURIComponent(
          `### 需求信息\n- **版本号**: ${r.version}\n- **目标板卡**: ${r.board}\n- **开发框架**: ${r.framework}\n- **分类 / 优先级**: ${r.category} / ${r.priority}\n- **勾选传感器**: ${sensorsMd}\n\n### 需求描述\n${r.description}\n\n### 初始代码框架\n\`\`\`cpp\n${r.starterCode}\n\`\`\``
        );
        const ghIssueUrl = `https://github.com/${GITHUB_REPO}/issues/new?title=${issueTitle}&body=${issueBody}`;
        const statusCls = r.status === "已验证" ? "tag-success" : r.status === "测试中" ? "tag-warning" : "tag";
        const sensorTags = sensorList.map((s) => `<span class="tag tag-success">${escapeHtml(s)}</span>`).join("");

        return `
        <article class="req-item">
          <div class="req-top">
            <div>
              <h4 class="req-title">${escapeHtml(r.title)}</h4>
              <div class="btn-row">
                <span class="tag tag-accent mono">${escapeHtml(r.version)}</span>
                <span class="tag">${escapeHtml(r.board)}</span>
                <span class="tag">${escapeHtml(r.framework)}</span>
                <span class="tag">${escapeHtml(r.category)}</span>
                <span class="tag ${statusCls}">${escapeHtml(r.status)}</span>
                ${sensorTags}
              </div>
            </div>
            <div class="btn-row">
              <button class="btn btn-sm" data-req-action="cycle" data-id="${escapeHtml(r.id)}">切换状态</button>
              <button class="btn btn-sm" data-req-action="copy" data-id="${escapeHtml(r.id)}">复制代码</button>
              <a class="btn btn-sm btn-dark" href="${ghIssueUrl}" target="_blank" rel="noopener">提交 GitHub Issue</a>
              <button class="btn btn-sm btn-danger" data-req-action="delete" data-id="${escapeHtml(r.id)}">删除</button>
            </div>
          </div>
          <div class="req-desc">${escapeHtml(r.description)}</div>
          <pre class="code-block">${escapeHtml(r.starterCode)}</pre>
        </article>`;
      })
      .join("");
  }

  $("reqForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const sensors = Array.from(selectedSensors);
    const payload = {
      title: $("reqTitle").value.trim(),
      board: $("reqBoard").value,
      framework: $("reqFramework").value,
      category: $("reqCategory").value,
      priority: $("reqPriority").value,
      description: $("reqDescription").value.trim(),
      sensors,
    };
    if (!payload.title || !payload.description) return;

    if (!state.bridgeOnline) {
      const version = `req-v${state.requirements.length + 1}.0`;
      state.requirements.unshift({
        id: `req_${Date.now()}`,
        version,
        ...payload,
        status: "待实现",
        starterCode: buildClientStarterCode(
          payload.title,
          payload.board,
          payload.framework,
          payload.description,
          version,
          sensors
        ),
        createdAt: new Date().toISOString(),
      });
      saveBrowserData();
      renderRequirements();
      $("reqForm").reset();
      selectedSensors.clear();
      renderSensorSelector();
      showToast(`已生成需求 ${version} 及代码框架`);
      return;
    }

    const res = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      $("reqForm").reset();
      selectedSensors.clear();
      renderSensorSelector();
      await loadRequirements();
      showToast(`已保存需求 ${data.requirement.version}`);
    }
  });

  $("reqList").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-req-action]");
    if (!btn) return;
    const { reqAction, id } = btn.dataset;
    const item = state.requirements.find((r) => r.id === id);
    if (!item) return;

    if (reqAction === "copy") {
      await navigator.clipboard.writeText(item.starterCode || "");
      showToast("代码框架已复制到剪贴板");
      return;
    }
    if (reqAction === "cycle") {
      const order = ["待实现", "测试中", "已验证"];
      const next = order[(order.indexOf(item.status) + 1) % order.length];
      if (!state.bridgeOnline) {
        item.status = next;
        saveBrowserData();
        renderRequirements();
      } else {
        await fetch(`/api/requirements/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        await loadRequirements();
      }
      showToast(`状态已更新为：${next}`);
      return;
    }
    if (reqAction === "delete") {
      if (!state.bridgeOnline) {
        state.requirements = state.requirements.filter((r) => r.id !== id);
        saveBrowserData();
        renderRequirements();
      } else {
        await fetch(`/api/requirements/${encodeURIComponent(id)}`, { method: "DELETE" });
        await loadRequirements();
      }
      showToast("已删除需求");
    }
  });

  // GitHub ESP32 App Hub
  async function loadApps(query = "") {
    if (state.bridgeOnline) {
      try {
        const res = await fetch(`/api/github/apps?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        state.apps = data.apps || FALLBACK_APPS;
        renderApps();
        return;
      } catch {}
    }

    if (!query) {
      state.apps = [...FALLBACK_APPS];
      renderApps();
      return;
    }

    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query + " esp32")}&sort=stars&order=desc&per_page=12`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("GitHub API 限流");
      const data = await res.json();
      state.apps = (data.items || []).map((r) => ({
        fullName: r.full_name,
        name: r.name,
        category: "GitHub 实时搜索",
        language: r.language || "C++",
        stargazersCount: r.stargazers_count || 0,
        updatedAt: r.updated_at || "",
        url: r.html_url,
        releasesUrl: `${r.html_url}/releases`,
        description: r.description || "暂无简介",
        recommendedFor: "ESP32 开源项目",
      }));
      renderApps();
    } catch {
      const lower = query.toLowerCase();
      state.apps = FALLBACK_APPS.filter(
        (a) => a.fullName.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
      );
      renderApps();
      showToast("已切换本地关键词筛选");
    }
  }

  function renderApps() {
    const grid = $("appsGrid");
    const filtered =
      state.activeCategory === "全部"
        ? state.apps
        : state.apps.filter((a) => a.category === state.activeCategory || a.category === "GitHub 实时搜索");

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">没有找到匹配的 ESP32 项目，换个关键词试试。</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (a) => `
      <article class="app-card">
        <div>
          <div class="app-card-head">
            <div>
              <h3 class="app-name">${escapeHtml(a.name)}</h3>
              <div class="app-repo">${escapeHtml(a.fullName)}</div>
            </div>
            <span class="tag mono">★ ${formatStars(a.stargazersCount)}</span>
          </div>
          <p class="app-desc">${escapeHtml(a.description)}</p>
        </div>

        <div>
          <div class="app-meta" style="margin-bottom: 12px;">
            <span class="tag tag-accent">${escapeHtml(a.category)}</span>
            <span class="tag">${escapeHtml(a.language || "C++")}</span>
            <span class="tag">${escapeHtml(a.recommendedFor || "ESP32")}</span>
          </div>
          <div class="btn-row">
            <a class="btn btn-sm btn-dark" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">GitHub</a>
            <a class="btn btn-sm" href="${escapeHtml(a.releasesUrl)}" target="_blank" rel="noopener">Releases</a>
            <button class="btn btn-sm" data-import-app="${escapeHtml(a.fullName)}">引用到需求</button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  $("appCategoryPills").addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document.querySelectorAll("#appCategoryPills .pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    state.activeCategory = pill.dataset.cat;
    renderApps();
  });

  $("githubSearchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("githubSearchInput").value.trim();
    state.activeCategory = "全部";
    document.querySelectorAll("#appCategoryPills .pill").forEach((p) => p.classList.toggle("active", p.dataset.cat === "全部"));
    showToast(q ? `正在 GitHub 搜索 "${q}"...` : "已恢复精选列表");
    await loadApps(q);
  });

  $("appsGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-import-app]");
    if (!btn) return;
    const repo = btn.dataset.importApp;
    const app = state.apps.find((a) => a.fullName === repo);
    if (!app) return;
    $("reqTitle").value = `基于 ${app.name} 的 ESP32 测试与定制`;
    $("reqDescription").value = `参考 GitHub 开源项目 ${app.fullName} (${app.url})：\n${app.description}\n\n期望在当前 ESP32 开发板（COM5）上验证并扩展以下功能：`;
    switchTab("requirements");
    showToast(`已将 ${app.name} 导入到需求工坊`);
  });

  // GitHub Releases
  async function loadReleases() {
    const container = $("releasesList");
    try {
      let releases = [];
      if (state.bridgeOnline) {
        const res = await fetch("/api/github/releases");
        const data = await res.json();
        releases = data.releases || [];
      } else {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`);
        if (res.ok) releases = await res.json();
      }
      if (!releases.length) {
        container.innerHTML = `<div class="empty-state">暂未读取到远端 Release，或仓库刚完成首次发布。</div>`;
        return;
      }
      container.className = "";
      container.innerHTML = releases
        .slice(0, 6)
        .map(
          (rel) => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <div>
            <span class="tag tag-success mono">${escapeHtml(rel.tag_name)}</span>
            <strong style="margin-left:8px;">${escapeHtml(rel.name || rel.tag_name)}</strong>
            <div style="font-size:12px;color:var(--ink-muted);margin-top:3px;">发布于 ${formatDate(rel.published_at)}</div>
          </div>
          <a class="btn btn-sm" href="${escapeHtml(rel.html_url)}" target="_blank" rel="noopener">查看发布详情</a>
        </div>`
        )
        .join("");
    } catch {
      container.innerHTML = `<div class="empty-state">无法连接 GitHub API，请直接点击上方按钮打开仓库 Releases。</div>`;
    }
  }

  $("btnReloadReleases").addEventListener("click", loadReleases);

  // Boot
  renderSensorSelector();
  initBridge();
})();
