"""Smoke tests for Hermes ESP32 Studio backend."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
import server

client = TestClient(server.app)


def test_meta_and_version():
    res = client.get("/api/meta")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Hermes ESP32 Studio"
    assert data["version"] == server.APP_VERSION
    assert data["repo"] == "HanweiJiang79/hermes"


def test_web_index_served():
    res = client.get("/")
    assert res.status_code == 200
    assert "Hermes ESP32 Studio" in res.text
    assert f"v{server.APP_VERSION}" in res.text


def test_curated_github_apps():
    res = client.get("/api/github/apps")
    assert res.status_code == 200
    data = res.json()
    assert len(data["apps"]) >= 10
    names = {a["fullName"] for a in data["apps"]}
    assert "78/xiaozhi-esp32" in names
    assert "espressif/esp-idf" in names


def test_requirements_crud(tmp_path, monkeypatch):
    monkeypatch.setattr(server, "REQUIREMENTS_FILE", tmp_path / "reqs.json")

    create_res = client.post(
        "/api/requirements",
        json={
            "title": "OLED 温湿度显示测试",
            "board": "ESP32-S3",
            "category": "屏幕与交互",
            "framework": "Arduino",
            "priority": "高",
            "description": "读取 DHT22 并在屏幕和串口输出。",
        },
    )
    assert create_res.status_code == 200
    req = create_res.json()["requirement"]
    assert req["version"] == "req-v1.0"
    assert "Arduino.h" in req["starterCode"]

    list_res = client.get("/api/requirements")
    assert list_res.status_code == 200
    assert len(list_res.json()["requirements"]) == 1

    patch_res = client.patch(f"/api/requirements/{req['id']}", json={"status": "测试中"})
    assert patch_res.status_code == 200
    assert patch_res.json()["requirement"]["status"] == "测试中"

    del_res = client.delete(f"/api/requirements/{req['id']}")
    assert del_res.status_code == 200


def test_backups_list():
    res = client.get("/api/backups")
    assert res.status_code == 200
    assert "backups" in res.json()
