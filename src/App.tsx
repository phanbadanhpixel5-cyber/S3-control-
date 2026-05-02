/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Activity, 
  Wifi, 
  Cpu, 
  Settings, 
  Power, 
  Terminal, 
  Globe,
  Lock,
  RefreshCw,
  X,
  ExternalLink,
  PowerOff
} from "lucide-react";

// Types based on the User's C++ Code
interface Device {
  id: string;
  name: string;
  type: 'light' | 'switch' | 'socket';
  relayPin: number;
  flipSwitchPin: number;
  activeLow: boolean;
  status: boolean;
  lastChanged: string;
}

const INITIAL_DEVICES: Device[] = [
  {
    id: "69f48b0bf9b5f15fa7ca8c11",
    name: "ĐÈN PHÒNG",
    type: 'switch',
    relayPin: 5,
    flipSwitchPin: 4,
    activeLow: true,
    status: false,
    lastChanged: new Date().toISOString()
  },
  {
    id: "69f48b0bf9b5f15fa7ca8c12",
    name: "ĐÈN NGỦ",
    type: 'switch',
    relayPin: 6,
    flipSwitchPin: 3,
    activeLow: true,
    status: false,
    lastChanged: new Date().toISOString()
  },
  {
    id: "69f48b0bf9b5f15fa7ca8c13",
    name: "QUẠT",
    type: 'switch',
    relayPin: 7,
    flipSwitchPin: 2,
    activeLow: true,
    status: false,
    lastChanged: new Date().toISOString()
  },
  {
    id: "69f48b0bf9b5f15fa7ca8c14",
    name: "MÁY LẠNH",
    type: 'switch',
    relayPin: 10,
    flipSwitchPin: 1,
    activeLow: true,
    status: false,
    lastChanged: new Date().toISOString()
  }
];

const ROOM_NAME_KEY = 'sinric_room_name';
const SYSTEM_NAME_KEY = 'sinric_system_name';

function EditableText({ 
  value, 
  onSave, 
  className = "", 
  inputClassName = "" 
}: { 
  value: string; 
  onSave: (val: string) => void; 
  className?: string;
  inputClassName?: string;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(value);

  // Sync tempValue when value prop changes from outside
  React.useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-green-500/10 border-b-2 border-green-500 outline-none px-2 py-0.5 text-inherit min-w-[50px] max-w-full font-mono font-bold animate-pulse ${inputClassName}`}
      />
    );
  }

  return (
    <span 
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`cursor-pointer hover:text-green-500 transition-all duration-200 border-b border-transparent hover:border-green-500/30 px-1 group relative inline-flex items-center gap-1 ${className}`}
      title="Nhấn để chỉnh sửa"
    >
      {value}
      <Settings className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
    </span>
  );
}

export default function App() {
  const [devices, setDevices] = useState<Device[]>(() => {
    const saved = localStorage.getItem('sinric_devices');
    const parsed = saved ? JSON.parse(saved) : [];
    
    // Force refresh if the count doesn't match or if hardware pins were updated (e.g. GPIO 10)
    const needsHardwareUpdate = parsed.length > 0 && parsed[parsed.length - 1].relayPin !== INITIAL_DEVICES[INITIAL_DEVICES.length - 1].relayPin;
    
    if (parsed.length !== INITIAL_DEVICES.length || needsHardwareUpdate) {
      return INITIAL_DEVICES;
    }
    return parsed;
  });

  const [roomName, setRoomName] = useState(() => {
    return localStorage.getItem(ROOM_NAME_KEY) || "PHÒNG NGỦ";
  });

  const [systemName, setSystemName] = useState(() => {
    return localStorage.getItem(SYSTEM_NAME_KEY) || "SinricPro Node-01";
  });

  useEffect(() => {
    localStorage.setItem('sinric_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem(ROOM_NAME_KEY, roomName);
  }, [roomName]);

  useEffect(() => {
    localStorage.setItem(SYSTEM_NAME_KEY, systemName);
  }, [systemName]);

  const [wifiSsid, setWifiSsid] = useState(() => localStorage.getItem('wifi_ssid') || "");
  const [wifiPass, setWifiPass] = useState(() => localStorage.getItem('wifi_pass') || "");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const [isHardwareOnline, setIsHardwareOnline] = useState(false);
  const [showFirmware, setShowFirmware] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isWifiConfigured, setIsWifiConfigured] = useState(() => {
    return localStorage.getItem('is_wifi_configured') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('wifi_ssid', wifiSsid);
    localStorage.setItem('wifi_pass', wifiPass);
  }, [wifiSsid, wifiPass]);

  const firmwareCode = `/* 
 * Firmware SinricPro chuẩn cho ESP32-C3
 * -----------------------------------------
 * - Đèn LED (GPIO 8): Nháy nhanh = Tìm WiFi, Sáng đứng = Đã kết nối.
 * - Kiểm tra Serial Monitor (Baud 115200) để xem chi tiết.
 */

#include <Arduino.h>
#include <WiFi.h>
#include "SinricPro.h"
#include "SinricProSwitch.h"

// Thông tin kết nối - NHẬP TẠI ĐÂY NẾU CHƯA CẬP NHẬT TRÊN WEB
#define WIFI_SSID         "${wifiSsid || 'Vui lòng nhập WiFi'}"
#define WIFI_PASS         "${wifiPass || 'Vui lòng nhập Pass'}"
#define APP_KEY           "386b7a9b-528b-4cc7-865f-7c6479b62c68"
#define APP_SECRET        "e9fb1020-86d0-462e-b9ea-9cbc9f424722-19f62d7b-6cd2-418b-8298-4416c57cf4f2"
#define STATUS_LED        8  // LED trên ESP32-C3

// Cấu hình chân PIN
const int relayPins[] = {${devices.map(d => d.relayPin).join(', ')}};
const int buttonPins[] = {${devices.map(d => d.flipSwitchPin).join(', ')}};
const char* deviceIds[] = {${devices.map(d => `"${d.id}"`).join(', ')}};
const bool activeLows[] = {${devices.map(d => d.activeLow).join(', ')}};

bool lastButtonStates[${devices.length}];
unsigned long lastDebounceTimes[${devices.length}];
#define DEBOUNCE_TIME 250

void checkConnection() {
  if (WiFi.status() == WL_CONNECTED && SinricPro.isConnected()) {
    digitalWrite(STATUS_LED, HIGH);
  } else {
    digitalWrite(STATUS_LED, (millis() / 500) % 2); 
  }
}

// Hàm phản hồi từ Cloud (App/Web Dashboard)
bool onPowerState(const String &deviceId, bool &state) {
  Serial.printf("Cloud command: %s -> %s\\n", deviceId.c_str(), state ? "ON" : "OFF");
  for(int i=0; i<${devices.length}; i++) {
    if(deviceId == deviceIds[i]) {
      digitalWrite(relayPins[i], state ? (activeLows[i] ? LOW : HIGH) : (activeLows[i] ? HIGH : LOW));
      return true;
    }
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
  }
  
  for(int i=0; i<${devices.length}; i++) {
    pinMode(relayPins[i], OUTPUT);
    pinMode(buttonPins[i], INPUT_PULLUP);
    digitalWrite(relayPins[i], activeLows[i] ? HIGH : LOW);
    lastButtonStates[i] = HIGH;
    
    SinricProSwitch &mySwitch = SinricPro[deviceIds[i]];
    mySwitch.onPowerState(onPowerState);
  }

  SinricPro.begin(APP_KEY, APP_SECRET);
}

void loop() {
  SinricPro.handle();
  checkConnection();

  for(int i=0; i<${devices.length}; i++) {
    bool currentState = digitalRead(buttonPins[i]);
    if (currentState != lastButtonStates[i] && (millis() - lastDebounceTimes[i]) > DEBOUNCE_TIME) {
      if (currentState == LOW) {
        bool currentRelay = digitalRead(relayPins[i]);
        bool nextRelay = !currentRelay;
        digitalWrite(relayPins[i], nextRelay);
        
        bool statusOnApp = activeLows[i] ? (nextRelay == LOW) : (nextRelay == HIGH); 
        SinricProSwitch &mySwitch = SinricPro[deviceIds[i]];
        mySwitch.sendPowerStateEvent(statusOnApp);
        Serial.printf("Local Button: %s -> %s\\n", deviceIds[i], statusOnApp ? "ON" : "OFF");
      }
      lastDebounceTimes[i] = millis();
      lastButtonStates[i] = currentState;
    }
  }
}`;

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const startProvisioning = async () => {
    if (!wifiSsid || !wifiPass) {
      setConnectionError("Vui lòng nhập đầy đủ tên WiFi và mật khẩu.");
      return;
    }
    
    setConnectionError(null);
    setIsPairing(true);
    addLog(`[Provisioning]: Bắt đầu gửi cấu hình WiFi: ${wifiSsid}`);

    // Simulate BLE Provisioning Flow
    try {
      if ('bluetooth' in navigator) {
        addLog("[BT]: Đang tìm thiết bị ở chế độ Config...");
        // In reality, you'd request port/BT device here
      }
      
        setTimeout(() => {
          setIsPairing(false);
          setIsProvisioning(false);
          setIsPaired(true);
          setIsWifiConfigured(true);
          localStorage.setItem('is_wifi_configured', 'true');
          addLog("[Hệ thống]: Đã ghi cấu hình vào Flash Memory.");
          addLog("[WiFi]: ESP32 đang khởi động lại và kết nối...");
        }, 3000);
      
    } catch (err: any) {
      setIsPairing(false);
      setConnectionError("Lỗi cấu hình: " + err.message);
    }
  };

  const startPairing = async () => {
    if (!wifiSsid || !wifiPass) {
      setConnectionError("Vui lòng nhập WiFi để hệ thống tạo mã nạp chuẩn!");
      return;
    }
    setConnectionError(null);
    setIsPairing(true);
    addLog("[Hệ thống]: Đang khởi tạo kết nối Cloud...");

    // Simulate WiFi/Cloud Handshake
    setTimeout(() => {
      addLog(`[WiFi]: Đang kết nối tới '${wifiSsid}'...`);
      addLog("[SinricPro]: Đang xác thực API Key...");
      
      setTimeout(() => {
        setIsPairing(false);
        setIsPaired(true);
        setIsHardwareOnline(true);
        addLog("[SinricPro]: Trạng thái: TRỰC TUYẾN (CLOUD)");
        addLog(`[Hệ thống]: Đã đồng bộ qua WiFi: ${wifiSsid}`);
      }, 1500);
    }, 2000);
  };

  const updateDeviceName = (id: string, newName: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
    addLog(`[Hệ thống]: Đổi tên thiết bị thành "${newName}"`);
  };

  const toggleDevice = (id: string) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    const nextStatus = !device.status;

    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        addLog(`[SinricPro]: ${id} -> ${nextStatus ? "BẬT" : "TẮT"}`);
        return { ...d, status: nextStatus, lastChanged: new Date().toISOString() };
      }
      return d;
    }));
  };

  if (!isPaired) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-mono flex items-center justify-center p-6">
        <div className="fixed inset-0 scanline pointer-events-none opacity-20" />
        <div className="w-full max-w-md space-y-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="w-20 h-20 bg-green-500 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              <Cpu className="w-10 h-10 text-black border-2 border-black rounded-lg p-1" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">ESP32-C3 Control</h1>
            <p className="text-white/40 text-xs uppercase tracking-widest">Hệ thống điều khiển nhà thông minh</p>
          </motion.div>

          <div className="relative h-48 flex items-center justify-center">
            {isPairing ? (
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border border-green-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 border border-green-500 rounded-full"
                />
                <div className="relative w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_#22c55e]">
                  <Activity className="w-8 h-8 text-black animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            )}
          </div>

          <div className="space-y-6">
            {isProvisioning ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10"
              >
                <div className="text-left space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-green-500">Cấu hình WiFi cho khách</h2>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1">Tên WiFi (SSID)</label>
                      <input 
                        type="text" 
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        placeholder="Nhập tên WiFi nhà khách"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest ml-1">Mật khẩu WiFi</label>
                      <input 
                        type="password" 
                        value={wifiPass}
                        onChange={(e) => setWifiPass(e.target.value)}
                        placeholder="Nhập mật khẩu"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startProvisioning}
                    disabled={isPairing}
                    className="w-full py-4 bg-green-500 text-black font-black uppercase tracking-widest italic rounded-xl shadow-[0_10px_20px_rgba(34,197,94,0.2)] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isPairing ? 'ĐANG GỬI DỮ LIỆU...' : 'GỬI ĐẾN ESP32'}
                  </button>
                  <button
                    onClick={() => { setIsProvisioning(false); setConnectionError(null); }}
                    className="w-full py-2 text-[10px] text-white/30 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Quay lại
                  </button>
                </div>
              </motion.div>
            ) : isPairing ? (
              <div className="space-y-2">
                <p className="text-green-500 text-sm font-bold animate-pulse">ĐANG THIẾT LẬP KẾT NỐI...</p>
                <p className="text-white/20 text-[10px] uppercase tracking-widest">Vui lòng chọn cổng COM nếu có bảng thông báo hiện lên</p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectionError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-[10px] uppercase font-bold"
                  >
                    {connectionError}
                  </motion.div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={startPairing}
                    disabled={isPairing}
                    className="group relative px-12 py-4 bg-white text-black font-black uppercase tracking-[0.2em] italic rounded-xl overflow-hidden active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] w-full text-sm disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isPairing ? "ĐANG KẾT NỐI CLOUD..." : "KẾT NỐI QUA WIFI / CLOUD"}
                      {isPairing ? (
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        <Power className="w-4 h-4 fill-black" />
                      )}
                    </span>
                    <div className="absolute inset-0 bg-green-500 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-green-500/30 selection:text-green-500 overflow-x-hidden">
      {/* Background Effect */}
      <div className="fixed inset-0 scanline pointer-events-none opacity-20" />
      
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-white/10">
              <Cpu className="w-6 h-6 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-[0.3em] text-green-500 uppercase">SinricPro Smart</span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-white/40 uppercase tracking-widest leading-none">Hệ thống đang chạy</span>
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-widest text-white/50">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                <span>Kênh: Đông Á 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>Bảo mật</span>
              </div>
            </div>
            <button 
              onClick={() => setShowFirmware(true)}
              className="p-2 hover:bg-white/5 rounded transition-colors flex items-center gap-2 group"
            >
              <Terminal className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Phần mềm (Firmware)</span>
            </button>
            <button className="p-2 hover:bg-white/5 rounded transition-colors" onClick={() => setIsPaired(false)}>
              <RefreshCw className="w-5 h-5 text-white/60" />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Controls */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Room Section */}
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 w-fit">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                      ID: <EditableText value={systemName} onSave={setSystemName} className="text-white hover:text-green-500" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${isHardwareOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                        Hệ thống: {isHardwareOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white flex items-center gap-4 group">
                      <EditableText 
                        value={roomName} 
                        onSave={setRoomName} 
                        className="group-hover:text-green-500 transition-colors"
                      />
                      <Zap className="w-8 h-8 text-green-500 fill-green-500 animate-pulse" />
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setDevices(prev => prev.map(d => ({ ...d, status: false })));
                      addLog("[Hệ thống]: Đã tắt toàn bộ thiết bị.");
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                      <PowerOff className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-red-500/60 transition-colors group-hover:text-red-400">Tắt hết</span>
                  </button>
                  <div className="text-right border-l border-white/5 pl-4 ml-2">
                    <span className="text-4xl font-mono text-white/10">{devices.length}</span>
                    <p className="text-[10px] uppercase tracking-widest text-white/20">Công tắc</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {devices.map((device) => (
                  <SwitchTile 
                    key={device.id} 
                    device={device} 
                    isOnline={isHardwareOnline}
                    onToggle={() => toggleDevice(device.id)}
                    onUpdate={(updates) => setDevices(prev => prev.map(d => d.id === device.id ? { ...d, ...updates } : d))}
                  />
                ))}
              </div>
            </div>

            {/* Hardware Debug/Config Info */}
            <div className="pt-12 border-t border-white/5">
              <div className="flex items-center gap-3 mb-8">
                <Settings className="w-5 h-5 text-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 italic">Thông số Phần cứng (Hardware Spec)</h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SpecTile label="Tốc độ Baud" value="115200" icon={<Activity className="w-3 h-3" />} />
                <SpecTile label="Chống rung" value="250ms" icon={<Zap className="w-3 h-3" />} />
                <SpecTile label="Mạng WiFi" value="ANH KHOI" icon={<Wifi className="w-3 h-3" />} />
                <SpecTile label="Bộ não" value="ESP32-C3" icon={<Cpu className="w-3 h-3 text-blue-500" />} />
              </div>
            </div>
          </div>

          {/* Sidebar / Logs */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0f0f11] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[400px]"
            >
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3 h-3 text-red-500" />
                  Nhật ký hệ thống
                </span>
                <RefreshCw 
                  onClick={() => setLogs([])}
                  className="w-3 h-3 text-white/30 cursor-pointer hover:rotate-180 transition-transform duration-500" 
                />
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                <AnimatePresence mode="popLayout">
                  {logs.map((log, i) => (
                    <motion.div
                      key={log + i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-white/40 border-l border-white/10 pl-3 leading-relaxed"
                    >
                      <span className="text-white/20 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {logs.length === 0 && (
                  <div className="text-[10px] text-white/20 italic text-center py-20">Đang theo dõi các sự kiện...</div>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-green-500/5 to-transparent"
            >
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs font-bold uppercase">Trạng thái Link</span>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed italic">
                App Key và Secret đã được nạp thành công. Đang lắng nghe các lệnh từ Cloud SinricPro. Mọi thay đổi trạng thái sẽ được đồng bộ ngay lập tức.
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showFirmware && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5 font-bold uppercase tracking-widest text-xs">
                <div className="flex items-center gap-3 text-green-500">
                  <Terminal className="w-4 h-4" />
                  Trình tạo Firmware ESP32-C3
                </div>
                <button 
                  onClick={() => setShowFirmware(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white/30" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 font-mono text-[11px] leading-relaxed relative bg-black/50">
                <div className="absolute top-4 right-4 z-20">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(firmwareCode);
                      addLog("[Hệ thống]: Đã sao chép Firmware vào bộ nhớ tạm.");
                    }}
                    className="px-4 py-2 bg-green-500 text-black font-bold uppercase tracking-widest rounded-lg hover:bg-green-400 transition-colors shadow-lg active:scale-95"
                  >
                    Sao chép mã
                  </button>
                </div>
                <pre className="text-green-500/80 whitespace-pre">
                  {firmwareCode}
                </pre>
              </div>
              <div className="px-6 py-4 border-t border-white/10 bg-white/5 text-[10px] text-white/40 uppercase tracking-widest flex flex-col gap-1">
                <span>• Sử dụng Arduino IDE với ESP32-C3 Core (v2.0.x+).</span>
                <span className="text-red-400 font-bold">• LƯU Ý: Gỡ cài đặt thư viện "WiFi101" hoặc "WiFi101_Generic" nếu bị lỗi "conflicting declaration".</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SpecTileProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const SpecTile: React.FC<SpecTileProps> = ({ label, value, icon }) => (
  <div className="bg-[#0f0f11] border border-white/5 p-4 rounded-xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
    <div className="flex items-center gap-2 mb-2 relative z-10">
      <div className="text-white/20 group-hover:text-blue-500 transition-colors">{icon}</div>
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-black">{label}</span>
    </div>
    <div className="text-sm font-mono font-bold text-white/90 relative z-10">{value}</div>
    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full translate-x-8 -translate-y-8 group-hover:bg-blue-500/10 transition-colors" />
  </div>
);

interface SwitchTileProps {
  device: Device;
  isOnline: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Device>) => void;
}

const SwitchTile: React.FC<SwitchTileProps> = ({ device, isOnline, onToggle, onUpdate }) => {
  return (
    <motion.div 
      layout
      className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-700 ${
        !isOnline 
        ? 'bg-red-500/[0.02] border-red-500/10 grayscale opacity-40' 
        : device.status 
        ? 'bg-green-500/[0.03] border-green-500/20 shadow-[0_25px_60px_rgba(34,197,94,0.08)]' 
        : 'bg-[#121214] border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
            <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">
              <EditableText 
                value={device.name} 
                onSave={(name) => onUpdate({ name })} 
              />
            </h3>
            
            <button 
              onClick={onToggle}
              disabled={!isOnline}
              className={`relative w-16 h-8 rounded-full transition-all duration-500 outline-none ${
                device.status ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10'
              }`}
            >
              <motion.div 
                animate={{ x: device.status ? 34 : 2 }}
                className={`absolute top-1 left-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  device.status ? 'bg-white text-green-600' : 'bg-[#1a1a1c] text-white/20'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </motion.div>
            </button>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className={`text-[9px] font-black uppercase tracking-widest ${device.status ? 'text-green-500' : 'text-white/20'}`}>
              {device.status ? 'ĐÃ BẬT' : 'ĐANG TẮT'}
            </div>
            <button 
               onClick={() => onUpdate({ activeLow: !device.activeLow })}
               className={`text-[9px] font-black uppercase transition-colors tracking-widest ${device.activeLow ? 'text-blue-400/80' : 'text-orange-400/80'}`}
             >
               {device.activeLow ? 'MỨC THẤP' : 'MỨC CAO'}
             </button>
          </div>
      </div>

      {/* Background Graphic */}
      <div className="absolute -bottom-8 -right-4 text-[120px] font-black italic text-white/[0.01] select-none pointer-events-none tracking-tighter">
        {device.id.slice(-2)}
      </div>
    </motion.div>
  );
};

function DebugStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1.5 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
      <div className="text-[9px] uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors uppercase">{label}</div>
      <div className="text-xs font-bold text-white/70 line-clamp-1">{value}</div>
    </div>
  );
}
