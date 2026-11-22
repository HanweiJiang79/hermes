# Changelog

All notable changes to **Hermes ESP32 Studio** will be documented in this file.

## [v1.2.0] - 2026-11-21

### Added
- **推荐传感器勾选面板**：在「需求工坊」新增 14 款 ESP32 常用推荐传感器多选卡片（涵盖 I2C/UART/I2S/GPIO/DVP），勾选后实时显示推荐参考引脚接线，并自动将所选传感器带入代码框架与 GitHub Issue。

## [v1.1.0] - 2026-11-21

### Added
- 发布 GitHub Pages 在线网页版，内置浏览器端 `esptool-js`（Web Serial API）直连 `COM5` 进行固件读取、备份、恢复与烧录。

## [v1.0.1] - 2026-11-21

### Fixed
- 修复 Windows `start.bat` 中浏览器早于本地服务打开导致的 `ERR_CONNECTION_REFUSED` 问题（延迟 3 秒打开浏览器）。
- 为 `start.bat` 增加依赖安装失败检测及国内清华 PyPI 镜像自动回退。

## [v1.0.0] - 2026-11-21

### Added
- **ESP32 固件读取、备份与恢复**：通过 `esptool` 自动识别芯片型号与 Flash 容量，支持一键读取并备份原始固件（带版本号、时间戳与 SHA-256 校验）、下载 `.bin` 备份文件以及一键恢复至开发板。
- **实时串口监视器**：支持本地串口服务（SSE 实时流）及 Chrome/Edge 浏览器 Web Serial API 双模式连接（适配 `COM5` 等 CH340/CP210x 端口）。
- **功能需求工坊**：支持在界面中输入新的 ESP32 功能需求，自动生成 Arduino / ESP-IDF / MicroPython 代码框架与开发规格书，并支持一键跳转创建 GitHub Issue。
- **ESP32 GitHub 应用广场**：内置 12 款当前最新热门 ESP32 开源项目（含 `78/xiaozhi-esp32`、`espressif/esp-idf`、`esphome/esphome`、`wled/WLED` 等），支持分类筛选与实时 GitHub 仓库搜索。
- **版本管理与 GitHub 发布集成**：全界面版本号标识、版本变更记录展示、GitHub Releases 拉取与 CI 自动校验。
