/*
 * Hermes ESP32-S3 BLE HID Keyboard + Mouse + Media Controller (iPad / iOS / PC)
 * Version: ble-hid-v1.0.0
 *
 * Pair "Hermes-iPad-HID" in iPad Settings -> Bluetooth, then send commands
 * from Hermes ESP32 Studio Serial Monitor (115200 bps).
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <BLEHIDDevice.h>
#include <HIDTypes.h>
#include <HIDKeyboardTypes.h>

#ifndef FIRMWARE_VERSION
#define FIRMWARE_VERSION "ble-hid-v1.0.0"
#endif

static const char *DEVICE_NAME = "Hermes-iPad-HID";
static const int BOOT_BTN_PIN = 0;

// Report IDs
#define REPORT_ID_KEYBOARD 1
#define REPORT_ID_MOUSE    2
#define REPORT_ID_CONSUMER 3

// Modifier bitmasks
#define MOD_LCTRL  0x01
#define MOD_LSHIFT 0x02
#define MOD_LALT   0x04
#define MOD_LGUI   0x08  // Apple Command key on iPad / macOS

// Consumer control bitmasks (Report ID 3, 2 bytes)
#define MEDIA_PLAY_PAUSE 0x0001
#define MEDIA_NEXT_TRACK 0x0002
#define MEDIA_PREV_TRACK 0x0004
#define MEDIA_MUTE       0x0008
#define MEDIA_VOL_UP     0x0010
#define MEDIA_VOL_DOWN   0x0020
#define MEDIA_AC_HOME    0x0040
#define MEDIA_POWER      0x0080

// Standard composite HID Report Descriptor: Keyboard + Mouse + Consumer Control
static const uint8_t HID_REPORT_MAP[] = {
  // ---- Report ID 1: Keyboard ----
  0x05, 0x01,       // Usage Page (Generic Desktop)
  0x09, 0x06,       // Usage (Keyboard)
  0xA1, 0x01,       // Collection (Application)
  0x85, REPORT_ID_KEYBOARD,
  0x05, 0x07,       //   Usage Page (Key Codes)
  0x19, 0xE0,       //   Usage Minimum (224)
  0x29, 0xE7,       //   Usage Maximum (231)
  0x15, 0x00,       //   Logical Minimum (0)
  0x25, 0x01,       //   Logical Maximum (1)
  0x75, 0x01,       //   Report Size (1)
  0x95, 0x08,       //   Report Count (8)
  0x81, 0x02,       //   Input (Data, Variable, Absolute) - Modifier byte
  0x95, 0x01,       //   Report Count (1)
  0x75, 0x08,       //   Report Size (8)
  0x81, 0x01,       //   Input (Constant) - Reserved byte
  0x95, 0x06,       //   Report Count (6)
  0x75, 0x08,       //   Report Size (8)
  0x15, 0x00,       //   Logical Minimum (0)
  0x25, 0x65,       //   Logical Maximum (101)
  0x05, 0x07,       //   Usage Page (Key Codes)
  0x19, 0x00,       //   Usage Minimum (0)
  0x29, 0x65,       //   Usage Maximum (101)
  0x81, 0x00,       //   Input (Data, Array) - Key array (6 keys)
  0xC0,             // End Collection

  // ---- Report ID 2: Mouse ----
  0x05, 0x01,       // Usage Page (Generic Desktop)
  0x09, 0x02,       // Usage (Mouse)
  0xA1, 0x01,       // Collection (Application)
  0x85, REPORT_ID_MOUSE,
  0x09, 0x01,       //   Usage (Pointer)
  0xA1, 0x00,       //   Collection (Physical)
  0x05, 0x09,       //     Usage Page (Buttons)
  0x19, 0x01,       //     Usage Minimum (1)
  0x29, 0x03,       //     Usage Maximum (3)
  0x15, 0x00,       //     Logical Minimum (0)
  0x25, 0x01,       //     Logical Maximum (1)
  0x95, 0x03,       //     Report Count (3)
  0x75, 0x01,       //     Report Size (1)
  0x81, 0x02,       //     Input (Data, Variable, Absolute) - 3 buttons
  0x95, 0x01,       //     Report Count (1)
  0x75, 0x05,       //     Report Size (5)
  0x81, 0x01,       //     Input (Constant) - 5 bit padding
  0x05, 0x01,       //     Usage Page (Generic Desktop)
  0x09, 0x30,       //     Usage (X)
  0x09, 0x31,       //     Usage (Y)
  0x09, 0x38,       //     Usage (Wheel)
  0x15, 0x81,       //     Logical Minimum (-127)
  0x25, 0x7F,       //     Logical Maximum (127)
  0x75, 0x08,       //     Report Size (8)
  0x95, 0x03,       //     Report Count (3)
  0x81, 0x06,       //     Input (Data, Variable, Relative)
  0xC0,             //   End Collection
  0xC0,             // End Collection

  // ---- Report ID 3: Consumer Control (Media & iPad Home) ----
  0x05, 0x0C,       // Usage Page (Consumer)
  0x09, 0x01,       // Usage (Consumer Control)
  0xA1, 0x01,       // Collection (Application)
  0x85, REPORT_ID_CONSUMER,
  0x15, 0x00,       //   Logical Minimum (0)
  0x25, 0x01,       //   Logical Maximum (1)
  0x75, 0x01,       //   Report Size (1)
  0x95, 0x08,       //   Report Count (8)
  0x09, 0xCD,       //   Usage (Play/Pause)
  0x09, 0xB5,       //   Usage (Scan Next Track)
  0x09, 0xB6,       //   Usage (Scan Previous Track)
  0x09, 0xE2,       //   Usage (Mute)
  0x09, 0xE9,       //   Usage (Volume Increment)
  0x09, 0xEA,       //   Usage (Volume Decrement)
  0x0A, 0x23, 0x02, //   Usage (AC Home)
  0x09, 0x30,       //   Usage (Power / Lock)
  0x81, 0x02,       //   Input (Data, Variable, Absolute)
  0x75, 0x08,       //   Report Size (8)
  0x95, 0x01,       //   Report Count (1)
  0x81, 0x01,       //   Input (Constant)
  0xC0              // End Collection
};

BLEHIDDevice *hid = nullptr;
BLECharacteristic *inputKeyboard = nullptr;
BLECharacteristic *inputMouse = nullptr;
BLECharacteristic *inputConsumer = nullptr;

volatile bool bleConnected = false;
String serialBuf;
bool lastBtnState = HIGH;
unsigned long lastBtnMs = 0;

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

void sendKeyRaw(uint8_t modifier, uint8_t keycode, uint16_t holdMs = 25) {
  if (!bleConnected || !inputKeyboard) return;
  uint8_t report[8] = {modifier, 0x00, keycode, 0, 0, 0, 0, 0};
  inputKeyboard->setValue(report, sizeof(report));
  inputKeyboard->notify();
  delay(holdMs);

  uint8_t releaseReport[8] = {0};
  inputKeyboard->setValue(releaseReport, sizeof(releaseReport));
  inputKeyboard->notify();
  delay(15);
}

void sendAsciiChar(char c) {
  uint8_t idx = static_cast<uint8_t>(c);
  if (idx >= 128) return;
  uint8_t mapped = keymap[idx].usage;
  uint8_t mod = keymap[idx].modifier;
  if (mapped == 0) return;
  sendKeyRaw(mod, mapped, 20);
}

void typeText(const String &text) {
  for (size_t i = 0; i < text.length(); ++i) {
    sendAsciiChar(text[i]);
  }
}

void sendMouseReport(uint8_t buttons, int8_t dx, int8_t dy, int8_t wheel) {
  if (!bleConnected || !inputMouse) return;
  uint8_t report[4] = {
    buttons,
    static_cast<uint8_t>(dx),
    static_cast<uint8_t>(dy),
    static_cast<uint8_t>(wheel)
  };
  inputMouse->setValue(report, sizeof(report));
  inputMouse->notify();
  delay(15);
}

void sendConsumerKey(uint16_t mask) {
  if (!bleConnected || !inputConsumer) return;
  uint8_t report[2] = {static_cast<uint8_t>(mask & 0xFF), static_cast<uint8_t>((mask >> 8) & 0xFF)};
  inputConsumer->setValue(report, sizeof(report));
  inputConsumer->notify();
  delay(40);

  uint8_t release[2] = {0, 0};
  inputConsumer->setValue(release, sizeof(release));
  inputConsumer->notify();
  delay(20);
}

void printHelp() {
  Serial.println("========== Hermes ESP32-S3 iPad 蓝牙键鼠控制器 ==========");
  Serial.printf("固件版本: %s | 蓝牙名称: %s\n", FIRMWARE_VERSION, DEVICE_NAME);
  Serial.println("配对方法: 打开 iPad 设置 -> 蓝牙 -> 连接 Hermes-iPad-HID");
  Serial.println("可用串口指令 (115200 bps):");
  Serial.println("  STATUS          查看蓝牙连接状态");
  Serial.println("  TYPE:<文字>      输入英文/数字，例如 TYPE:Hello iPad");
  Serial.println("  ENTER / SPACE / BACKSPACE / TAB / ESC");
  Serial.println("  UP / DOWN / LEFT / RIGHT   方向键");
  Serial.println("  HOME            返回 iPad 主屏幕");
  Serial.println("  SPOTLIGHT       打开 iPad 搜索 (Cmd+Space)");
  Serial.println("  VOL+ / VOL- / MUTE / PLAY / NEXT / PREV");
  Serial.println("  LOCK            锁屏");
  Serial.println("  MOVE:<dx>,<dy>  移动鼠标，例如 MOVE:40,-20");
  Serial.println("  CLICK / RCLICK  鼠标左键 / 右键");
  Serial.println("  SCROLL:<n>      滚轮滚动，例如 SCROLL:-3");
  Serial.println("=========================================================");
}

void handleCommand(String line) {
  line.trim();
  if (line.isEmpty()) return;

  String upper = line;
  upper.toUpperCase();

  if (upper == "HELP" || upper == "?") {
    printHelp();
    return;
  }
  if (upper == "STATUS") {
    Serial.printf("[STATUS] version=%s ble=%s device=%s\n",
                  FIRMWARE_VERSION, bleConnected ? "CONNECTED" : "ADVERTISING", DEVICE_NAME);
    return;
  }

  if (!bleConnected) {
    Serial.println("[提示] 蓝牙尚未连接！请先在 iPad 设置->蓝牙 中配对 Hermes-iPad-HID。");
    return;
  }

  if (upper.startsWith("TYPE:")) {
    String payload = line.substring(5);
    typeText(payload);
    Serial.printf("[OK] 已输入文本: %s\n", payload.c_str());
  } else if (upper == "ENTER") {
    sendKeyRaw(0, 0x28);
    Serial.println("[OK] ENTER");
  } else if (upper == "ESC") {
    sendKeyRaw(0, 0x29);
    Serial.println("[OK] ESC");
  } else if (upper == "BACKSPACE") {
    sendKeyRaw(0, 0x2A);
    Serial.println("[OK] BACKSPACE");
  } else if (upper == "TAB") {
    sendKeyRaw(0, 0x2B);
    Serial.println("[OK] TAB");
  } else if (upper == "SPACE") {
    sendKeyRaw(0, 0x2C);
    Serial.println("[OK] SPACE");
  } else if (upper == "RIGHT") {
    sendKeyRaw(0, 0x4F);
    Serial.println("[OK] RIGHT");
  } else if (upper == "LEFT") {
    sendKeyRaw(0, 0x50);
    Serial.println("[OK] LEFT");
  } else if (upper == "DOWN") {
    sendKeyRaw(0, 0x51);
    Serial.println("[OK] DOWN");
  } else if (upper == "UP") {
    sendKeyRaw(0, 0x52);
    Serial.println("[OK] UP");
  } else if (upper == "HOME") {
    sendConsumerKey(MEDIA_AC_HOME);
    sendKeyRaw(MOD_LGUI, 0x0B); // Cmd + H fallback for iPad
    Serial.println("[OK] HOME");
  } else if (upper == "SPOTLIGHT") {
    sendKeyRaw(MOD_LGUI, 0x2C); // Cmd + Space
    Serial.println("[OK] SPOTLIGHT (Cmd+Space)");
  } else if (upper == "PLAY") {
    sendConsumerKey(MEDIA_PLAY_PAUSE);
    Serial.println("[OK] PLAY/PAUSE");
  } else if (upper == "NEXT") {
    sendConsumerKey(MEDIA_NEXT_TRACK);
    Serial.println("[OK] NEXT TRACK");
  } else if (upper == "PREV") {
    sendConsumerKey(MEDIA_PREV_TRACK);
    Serial.println("[OK] PREV TRACK");
  } else if (upper == "MUTE") {
    sendConsumerKey(MEDIA_MUTE);
    Serial.println("[OK] MUTE");
  } else if (upper == "VOL+") {
    sendConsumerKey(MEDIA_VOL_UP);
    Serial.println("[OK] VOL+");
  } else if (upper == "VOL-") {
    sendConsumerKey(MEDIA_VOL_DOWN);
    Serial.println("[OK] VOL-");
  } else if (upper == "LOCK") {
    sendConsumerKey(MEDIA_POWER);
    Serial.println("[OK] LOCK");
  } else if (upper.startsWith("MOVE:")) {
    int comma = line.indexOf(',', 5);
    if (comma > 5) {
      int dx = constrain(line.substring(5, comma).toInt(), -127, 127);
      int dy = constrain(line.substring(comma + 1).toInt(), -127, 127);
      sendMouseReport(0, static_cast<int8_t>(dx), static_cast<int8_t>(dy), 0);
      Serial.printf("[OK] MOVE (%d, %d)\n", dx, dy);
    } else {
      Serial.println("[格式错误] 请使用 MOVE:dx,dy 例如 MOVE:50,-20");
    }
  } else if (upper == "CLICK") {
    sendMouseReport(0x01, 0, 0, 0);
    sendMouseReport(0x00, 0, 0, 0);
    Serial.println("[OK] LEFT CLICK");
  } else if (upper == "RCLICK") {
    sendMouseReport(0x02, 0, 0, 0);
    sendMouseReport(0x00, 0, 0, 0);
    Serial.println("[OK] RIGHT CLICK");
  } else if (upper.startsWith("SCROLL:")) {
    int delta = constrain(line.substring(7).toInt(), -127, 127);
    sendMouseReport(0, 0, 0, static_cast<int8_t>(delta));
    Serial.printf("[OK] SCROLL %d\n", delta);
  } else {
    Serial.printf("[未知指令] %s（输入 HELP 查看所有指令）\n", line.c_str());
  }
}

void setupBleHid() {
  BLEDevice::init(DEVICE_NAME);

  // iOS / iPadOS requires bonding & encryption for BLE HID devices
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
  hid->pnp(0x02, 0x05AC, 0x0220, 0x0100);
  hid->hidInfo(0x00, 0x01);
  hid->reportMap(const_cast<uint8_t *>(HID_REPORT_MAP), sizeof(HID_REPORT_MAP));
  hid->startServices();
  hid->setBatteryLevel(100);

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->setAppearance(HID_KEYBOARD);
  advertising->addServiceUUID(hid->hidService()->getUUID());
  advertising->setScanResponse(true);
  advertising->start();

  Serial.printf("[BLE] 蓝牙广播已启动: %s (等待 iPad 配对...)\n", DEVICE_NAME);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(BOOT_BTN_PIN, INPUT_PULLUP);
  printHelp();
  setupBleHid();
}

void loop() {
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

  // Short-press BOOT button (GPIO0) to trigger Play/Pause test
  bool btn = digitalRead(BOOT_BTN_PIN);
  if (lastBtnState == HIGH && btn == LOW && (millis() - lastBtnMs > 300)) {
    lastBtnMs = millis();
    if (bleConnected) {
      sendConsumerKey(MEDIA_PLAY_PAUSE);
      Serial.println("[BOOT键] 已发送 PLAY/PAUSE 控制指令");
    } else {
      Serial.println("[BOOT键] 当前未连接蓝牙，请先在 iPad 配对 Hermes-iPad-HID");
    }
  }
  lastBtnState = btn;
  delay(10);
}
