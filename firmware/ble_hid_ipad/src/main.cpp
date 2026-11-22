/*
 * Hermes ESP32-S3 All-in-One iPad Controller & Sensor Telemetry Firmware
 * Version: ble-hid-v2.0.0
 *
 * Features:
 *  1) BLE HID Composite Keyboard + Mouse + Consumer Media Control (iPad / iOS / PC)
 *  2) Built-in Wi-Fi Standalone Web Remote Server (saved in NVS Preferences)
 *  3) Real-time Sensor Telemetry (Internal Temp + I2C Bus Scan + GPIO Presence)
 *  4) Serial Monitor & BOOT Button (short=PLAY, long=HOME) control
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <BLEHIDDevice.h>
#include <HIDTypes.h>
#include <HIDKeyboardTypes.h>

#ifndef FIRMWARE_VERSION
#define FIRMWARE_VERSION "ble-hid-v2.0.0"
#endif

static const char *DEVICE_NAME = "Hermes-iPad-HID";
static const int BOOT_BTN_PIN = 0;
static const int I2C_SDA_PIN = 8;
static const int I2C_SCL_PIN = 9;
static const int PRESENCE_PIN = 4;

// Report IDs
#define REPORT_ID_KEYBOARD 1
#define REPORT_ID_MOUSE    2
#define REPORT_ID_CONSUMER 3

// Modifier bitmasks
#define MOD_LCTRL  0x01
#define MOD_LSHIFT 0x02
#define MOD_LALT   0x04
#define MOD_LGUI   0x08

// Consumer control bitmasks
#define MEDIA_PLAY_PAUSE 0x0001
#define MEDIA_NEXT_TRACK 0x0002
#define MEDIA_PREV_TRACK 0x0004
#define MEDIA_MUTE       0x0008
#define MEDIA_VOL_UP     0x0010
#define MEDIA_VOL_DOWN   0x0020
#define MEDIA_AC_HOME    0x0040
#define MEDIA_POWER      0x0080

static const uint8_t HID_REPORT_MAP[] = {
  // Report ID 1: Keyboard
  0x05, 0x01, 0x09, 0x06, 0xA1, 0x01, 0x85, REPORT_ID_KEYBOARD,
  0x05, 0x07, 0x19, 0xE0, 0x29, 0xE7, 0x15, 0x00, 0x25, 0x01,
  0x75, 0x01, 0x95, 0x08, 0x81, 0x02,
  0x95, 0x01, 0x75, 0x08, 0x81, 0x01,
  0x95, 0x06, 0x75, 0x08, 0x15, 0x00, 0x25, 0x65,
  0x05, 0x07, 0x19, 0x00, 0x29, 0x65, 0x81, 0x00,
  0xC0,
  // Report ID 2: Mouse
  0x05, 0x01, 0x09, 0x02, 0xA1, 0x01, 0x85, REPORT_ID_MOUSE,
  0x09, 0x01, 0xA1, 0x00,
  0x05, 0x09, 0x19, 0x01, 0x29, 0x03, 0x15, 0x00, 0x25, 0x01,
  0x95, 0x03, 0x75, 0x01, 0x81, 0x02,
  0x95, 0x01, 0x75, 0x05, 0x81, 0x01,
  0x05, 0x01, 0x09, 0x30, 0x09, 0x31, 0x09, 0x38,
  0x15, 0x81, 0x25, 0x7F, 0x75, 0x08, 0x95, 0x03, 0x81, 0x06,
  0xC0, 0xC0,
  // Report ID 3: Consumer Control
  0x05, 0x0C, 0x09, 0x01, 0xA1, 0x01, 0x85, REPORT_ID_CONSUMER,
  0x15, 0x00, 0x25, 0x01, 0x75, 0x01, 0x95, 0x08,
  0x09, 0xCD, 0x09, 0xB5, 0x09, 0xB6, 0x09, 0xE2,
  0x09, 0xE9, 0x09, 0xEA, 0x0A, 0x23, 0x02, 0x09, 0x30,
  0x81, 0x02, 0x75, 0x08, 0x95, 0x01, 0x81, 0x01,
  0xC0
};

BLEHIDDevice *hid = nullptr;
BLECharacteristic *inputKeyboard = nullptr;
BLECharacteristic *inputMouse = nullptr;
BLECharacteristic *inputConsumer = nullptr;

Preferences prefs;
WebServer httpServer(80);
bool httpStarted = false;

volatile bool bleConnected = false;
bool telemetryEnabled = false;
unsigned long lastTelemetryMs = 0;
int i2cDeviceCount = 0;
String i2cAddresses = "";

String serialBuf;
bool lastBtnState = HIGH;
unsigned long btnDownMs = 0;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    bleConnected = true;
    Serial.println("[BLE] 已连接！现在可以发送控制指令。");
  }
  void onDisconnect(BLEServer *server) override {
    bleConnected = false;
    Serial.println("[BLE] 连接已断开，重新开始蓝牙广播...");
    BLEDevice::startAdvertising();
  }
};

void sendKeyRaw(uint8_t modifier, uint8_t keycode, uint16_t holdMs = 22) {
  if (!bleConnected || !inputKeyboard) return;
  uint8_t report[8] = {modifier, 0x00, keycode, 0, 0, 0, 0, 0};
  inputKeyboard->setValue(report, sizeof(report));
  inputKeyboard->notify();
  delay(holdMs);
  uint8_t releaseReport[8] = {0};
  inputKeyboard->setValue(releaseReport, sizeof(releaseReport));
  inputKeyboard->notify();
  delay(12);
}

void sendAsciiChar(char c) {
  uint8_t idx = static_cast<uint8_t>(c);
  if (idx >= 128) return;
  uint8_t mapped = keymap[idx].usage;
  uint8_t mod = keymap[idx].modifier;
  if (mapped == 0) return;
  sendKeyRaw(mod, mapped, 18);
}

void typeText(const String &text) {
  for (size_t i = 0; i < text.length(); ++i) {
    sendAsciiChar(text[i]);
  }
}

void sendMouseReport(uint8_t buttons, int8_t dx, int8_t dy, int8_t wheel) {
  if (!bleConnected || !inputMouse) return;
  uint8_t report[4] = {buttons, static_cast<uint8_t>(dx), static_cast<uint8_t>(dy), static_cast<uint8_t>(wheel)};
  inputMouse->setValue(report, sizeof(report));
  inputMouse->notify();
  delay(15);
}

void sendConsumerKey(uint16_t mask) {
  if (!bleConnected || !inputConsumer) return;
  uint8_t report[2] = {static_cast<uint8_t>(mask & 0xFF), static_cast<uint8_t>((mask >> 8) & 0xFF)};
  inputConsumer->setValue(report, sizeof(report));
  inputConsumer->notify();
  delay(35);
  uint8_t release[2] = {0, 0};
  inputConsumer->setValue(release, sizeof(release));
  inputConsumer->notify();
  delay(18);
}

void scanI2CBus() {
  i2cDeviceCount = 0;
  i2cAddresses = "";
  for (uint8_t addr = 1; addr < 127; ++addr) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      if (i2cDeviceCount > 0) i2cAddresses += ",";
      char buf[8];
      snprintf(buf, sizeof(buf), "0x%02X", addr);
      i2cAddresses += buf;
      i2cDeviceCount++;
    }
  }
}

void emitTelemetry() {
  float chipTemp = temperatureRead();
  int presence = digitalRead(PRESENCE_PIN);
  long rssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;
  uint32_t freeHeapKB = ESP.getFreeHeap() / 1024;
  Serial.printf("TELEM:{\"temp\":%.1f,\"presence\":%d,\"i2c\":%d,\"i2cAddrs\":\"%s\",\"rssi\":%ld,\"heapKB\":%u,\"ble\":%d,\"uptime\":%lu}\n",
                chipTemp, presence, i2cDeviceCount, i2cAddresses.c_str(), rssi, freeHeapKB, bleConnected ? 1 : 0, millis() / 1000);
}

void handleCommand(String line);

// Standalone Mobile-Friendly Web Remote UI hosted right on ESP32-S3!
static const char STANDALONE_HTML[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hermes iPad 无线遥控器</title>
<style>
body{font-family:-apple-system,sans-serif;background:#f7f7f5;color:#18181b;margin:0;padding:16px;max-width:460px;margin:0 auto}
h2{font-size:18px;margin:0 0 12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
button{height:52px;border-radius:10px;border:1px solid #d4d4d8;background:#fff;font-size:14px;font-weight:600;cursor:pointer}
button.p{background:#2563eb;color:#fff;border-color:#2563eb}button.d{background:#18181b;color:#fff;border-color:#18181b}
.row{display:flex;gap:8px;margin-bottom:12px}input{flex:1;padding:10px;border-radius:8px;border:1px solid #d4d4d8;font-size:14px}
#st{font-size:12px;color:#52525b;margin-top:8px;font-family:monospace}
</style>
</head>
<body>
<h2>Hermes ESP32-S3 无线遥控器</h2>
<div class="grid">
  <button onclick="c('PREV')">上一首</button><button class="p" onclick="c('PLAY')">播放/暂停</button><button onclick="c('NEXT')">下一首</button>
  <button onclick="c('VOL-')">音量 -</button><button onclick="c('MUTE')">静音</button><button onclick="c('VOL+')">音量 +</button>
  <button class="d" onclick="c('HOME')">主屏幕</button><button class="d" onclick="c('SPOTLIGHT')">搜索</button><button class="d" onclick="c('LOCK')">锁屏</button>
  <button onclick="c('LEFT')">←</button><button class="p" onclick="c('ENTER')">确认</button><button onclick="c('RIGHT')">→</button>
  <button onclick="c('UP')">↑</button><button onclick="c('SPACE')">空格</button><button onclick="c('DOWN')">↓</button>
</div>
<div class="row"><input id="t" placeholder="输入文字发送到 iPad..."><button class="p" style="width:90px" onclick="sendT()">发送</button></div>
<div id="st">就绪</div>
<script>
async function c(cmd){const r=await fetch('/cmd?c='+encodeURIComponent(cmd));document.getElementById('st').textContent=await r.text();}
function sendT(){const v=document.getElementById('t').value;if(!v)return;c('TYPE:'+v);document.getElementById('t').value='';}
</script>
</body></html>
)HTML";

void startHttpRemote() {
  if (httpStarted) return;
  httpServer.on("/", HTTP_GET, []() {
    httpServer.send_P(200, "text/html; charset=utf-8", STANDALONE_HTML);
  });
  httpServer.on("/cmd", HTTP_GET, []() {
    String cmd = httpServer.arg("c");
    handleCommand(cmd);
    httpServer.send(200, "text/plain; charset=utf-8", "OK: " + cmd);
  });
  httpServer.on("/status", HTTP_GET, []() {
    String json = String("{\"version\":\"") + FIRMWARE_VERSION + "\",\"ble\":" + (bleConnected ? "true" : "false") +
                  ",\"temp\":" + String(temperatureRead(), 1) + ",\"ip\":\"" + WiFi.localIP().toString() + "\"}";
    httpServer.send(200, "application/json", json);
  });
  httpServer.begin();
  httpStarted = true;
  Serial.printf("[WiFi] 脱机无线遥控网页已启动: http://%s/\n", WiFi.localIP().toString().c_str());
}

void connectWifi(const String &ssid, const String &pass, bool saveToNvs) {
  if (ssid.isEmpty()) return;
  if (saveToNvs) {
    prefs.putString("ssid", ssid);
    prefs.putString("pass", pass);
  }
  Serial.printf("[WiFi] 正在连接 %s ...\n", ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(250);
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] 已连接！IP: %s\n", WiFi.localIP().toString().c_str());
    startHttpRemote();
  } else {
    Serial.println("[WiFi] 连接超时，请检查 Wi-Fi 名称和密码（仅支持 2.4GHz Wi-Fi）。");
  }
}

void printHelp() {
  Serial.println("========== Hermes ESP32-S3 全能控制器 v2.0 ==========");
  Serial.printf("固件版本: %s | 蓝牙名: %s\n", FIRMWARE_VERSION, DEVICE_NAME);
  Serial.println("指令: STATUS | TYPE:<文字> | ENTER/SPACE/BACKSPACE/TAB/ESC");
  Serial.println("      UP/DOWN/LEFT/RIGHT | HOME | SPOTLIGHT | LOCK");
  Serial.println("      VOL+/VOL-/MUTE/PLAY/NEXT/PREV | MOVE:dx,dy | CLICK/RCLICK | SCROLL:n");
  Serial.println("      WIFI:<名称>,<密码>  (配置脱机无线遥控网页)");
  Serial.println("      SENSOR:START / SENSOR:STOP / I2C:SCAN");
  Serial.println("=====================================================");
}

void handleCommand(String line) {
  line.trim();
  if (line.isEmpty()) return;
  String upper = line;
  upper.toUpperCase();

  if (upper == "HELP" || upper == "?") { printHelp(); return; }
  if (upper == "STATUS") {
    Serial.printf("[STATUS] version=%s ble=%s wifi=%s ip=%s temp=%.1fC i2c=%d\n",
                  FIRMWARE_VERSION,
                  bleConnected ? "CONNECTED" : "ADVERTISING",
                  WiFi.status() == WL_CONNECTED ? "CONNECTED" : "OFF",
                  WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString().c_str() : "-",
                  temperatureRead(),
                  i2cDeviceCount);
    return;
  }
  if (upper == "SENSOR:START") {
    telemetryEnabled = true;
    scanI2CBus();
    Serial.println("[SENSOR] 实时遥测采集已开启 (1Hz)");
    emitTelemetry();
    return;
  }
  if (upper == "SENSOR:STOP") {
    telemetryEnabled = false;
    Serial.println("[SENSOR] 实时遥测采集已停止");
    return;
  }
  if (upper == "I2C:SCAN") {
    scanI2CBus();
    Serial.printf("[I2C] 扫描完成，发现 %d 个设备: %s\n", i2cDeviceCount, i2cDeviceCount ? i2cAddresses.c_str() : "无");
    return;
  }
  if (upper.startsWith("WIFI:")) {
    int comma = line.indexOf(',', 5);
    if (comma > 5) {
      String ssid = line.substring(5, comma);
      String pass = line.substring(comma + 1);
      connectWifi(ssid, pass, true);
    } else {
      Serial.println("[格式错误] 请使用 WIFI:名称,密码");
    }
    return;
  }

  if (!bleConnected) {
    Serial.println("[提示] 蓝牙尚未连接！请先在 iPad 设置->蓝牙 中配对 Hermes-iPad-HID。");
    return;
  }

  if (upper.startsWith("TYPE:")) {
    String payload = line.substring(5);
    typeText(payload);
    Serial.printf("[OK] TYPE: %s\n", payload.c_str());
  } else if (upper == "ENTER") { sendKeyRaw(0, 0x28); Serial.println("[OK] ENTER"); }
  else if (upper == "ESC") { sendKeyRaw(0, 0x29); Serial.println("[OK] ESC"); }
  else if (upper == "BACKSPACE") { sendKeyRaw(0, 0x2A); Serial.println("[OK] BACKSPACE"); }
  else if (upper == "TAB") { sendKeyRaw(0, 0x2B); Serial.println("[OK] TAB"); }
  else if (upper == "SPACE") { sendKeyRaw(0, 0x2C); Serial.println("[OK] SPACE"); }
  else if (upper == "RIGHT") { sendKeyRaw(0, 0x4F); Serial.println("[OK] RIGHT"); }
  else if (upper == "LEFT") { sendKeyRaw(0, 0x50); Serial.println("[OK] LEFT"); }
  else if (upper == "DOWN") { sendKeyRaw(0, 0x51); Serial.println("[OK] DOWN"); }
  else if (upper == "UP") { sendKeyRaw(0, 0x52); Serial.println("[OK] UP"); }
  else if (upper == "HOME") { sendConsumerKey(MEDIA_AC_HOME); sendKeyRaw(MOD_LGUI, 0x0B); Serial.println("[OK] HOME"); }
  else if (upper == "SPOTLIGHT") { sendKeyRaw(MOD_LGUI, 0x2C); Serial.println("[OK] SPOTLIGHT"); }
  else if (upper == "PLAY") { sendConsumerKey(MEDIA_PLAY_PAUSE); Serial.println("[OK] PLAY/PAUSE"); }
  else if (upper == "NEXT") { sendConsumerKey(MEDIA_NEXT_TRACK); Serial.println("[OK] NEXT"); }
  else if (upper == "PREV") { sendConsumerKey(MEDIA_PREV_TRACK); Serial.println("[OK] PREV"); }
  else if (upper == "MUTE") { sendConsumerKey(MEDIA_MUTE); Serial.println("[OK] MUTE"); }
  else if (upper == "VOL+") { sendConsumerKey(MEDIA_VOL_UP); Serial.println("[OK] VOL+"); }
  else if (upper == "VOL-") { sendConsumerKey(MEDIA_VOL_DOWN); Serial.println("[OK] VOL-"); }
  else if (upper == "LOCK") { sendConsumerKey(MEDIA_POWER); Serial.println("[OK] LOCK"); }
  else if (upper.startsWith("MOVE:")) {
    int comma = line.indexOf(',', 5);
    if (comma > 5) {
      int dx = constrain(line.substring(5, comma).toInt(), -127, 127);
      int dy = constrain(line.substring(comma + 1).toInt(), -127, 127);
      sendMouseReport(0, static_cast<int8_t>(dx), static_cast<int8_t>(dy), 0);
      Serial.printf("[OK] MOVE (%d,%d)\n", dx, dy);
    }
  } else if (upper == "CLICK") { sendMouseReport(1, 0, 0, 0); sendMouseReport(0, 0, 0, 0); Serial.println("[OK] CLICK"); }
  else if (upper == "RCLICK") { sendMouseReport(2, 0, 0, 0); sendMouseReport(0, 0, 0, 0); Serial.println("[OK] RCLICK"); }
  else if (upper.startsWith("SCROLL:")) {
    int delta = constrain(line.substring(7).toInt(), -127, 127);
    sendMouseReport(0, 0, 0, static_cast<int8_t>(delta));
    Serial.printf("[OK] SCROLL %d\n", delta);
  } else {
    Serial.printf("[未知指令] %s\n", line.c_str());
  }
}

void setupBleHid() {
  BLEDevice::init(DEVICE_NAME);
  BLESecurity *security = new BLESecurity();
  security->setAuthenticationMode(ESP_LE_AUTH_BOND);
  security->setCapability(ESP_IO_CAP_NONE);
  security->setInitEncryptionKey(ESP_BLE_ENC_KEY_MASK | ESP_BLE_ID_KEY_MASK);

  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  hid = new BLEHIDDevice(server);
  inputKeyboard = hid->inputReport(REPORT_ID_KEYBOARD);
  inputMouse = hid->inputReport(REPORT_ID_MOUSE);
  inputConsumer = hid->inputReport(REPORT_ID_CONSUMER);

  hid->manufacturer()->setValue("Hermes Studio");
  hid->pnp(0x02, 0x05AC, 0x0220, 0x0200);
  hid->hidInfo(0x00, 0x01);
  hid->reportMap(const_cast<uint8_t *>(HID_REPORT_MAP), sizeof(HID_REPORT_MAP));
  hid->startServices();
  hid->setBatteryLevel(100);

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->setAppearance(HID_KEYBOARD);
  advertising->addServiceUUID(hid->hidService()->getUUID());
  advertising->setScanResponse(true);
  advertising->start();
  Serial.printf("[BLE] 蓝牙广播已启动: %s\n", DEVICE_NAME);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(BOOT_BTN_PIN, INPUT_PULLUP);
  pinMode(PRESENCE_PIN, INPUT_PULLDOWN);
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  scanI2CBus();

  prefs.begin("hermes", false);
  printHelp();
  setupBleHid();

  String savedSsid = prefs.getString("ssid", "");
  String savedPass = prefs.getString("pass", "");
  if (!savedSsid.isEmpty()) {
    connectWifi(savedSsid, savedPass, false);
  }
}

void loop() {
  if (httpStarted) {
    httpServer.handleClient();
  }

  while (Serial.available()) {
    char c = static_cast<char>(Serial.read());
    if (c == '\r') continue;
    if (c == '\n') {
      handleCommand(serialBuf);
      serialBuf = "";
    } else {
      serialBuf += c;
    }
  }

  if (telemetryEnabled && millis() - lastTelemetryMs >= 1000) {
    lastTelemetryMs = millis();
    emitTelemetry();
  }

  // BOOT button: short press = PLAY/PAUSE, long press (>1.2s) = HOME
  bool btn = digitalRead(BOOT_BTN_PIN);
  if (lastBtnState == HIGH && btn == LOW) {
    btnDownMs = millis();
  } else if (lastBtnState == LOW && btn == HIGH && btnDownMs > 0) {
    unsigned long held = millis() - btnDownMs;
    btnDownMs = 0;
    if (held > 1200) {
      handleCommand("HOME");
    } else if (held > 40) {
      handleCommand("PLAY");
    }
  }
  lastBtnState = btn;
  delay(8);
}
