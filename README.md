# Cold Chain Integrity — Real-Time Environmental Monitoring Dashboard

A pharmaceutical and cold-chain logistics monitoring dashboard built with **React 19**, **Vite**, **Tailwind CSS**, and **Firebase Realtime Database (RTDB)**. 

Designed for monitoring vaccine and biologic temperature compliance (WHO standard: **+2°C to +8°C**), container lid breaches, and ultrasonic clearance.

---

## 🚀 Dual Operating Modes

The dashboard features a clearly visible operating mode toggle in the header:

### 1. ⚡ Simulation Mode (Virtual Hardware Engine)
- **Zero-Hardware Testing**: Allows full testing of the dashboard, responsive charts, and alert logic without requiring physical hardware.
- **Realistic Telemetry**: Periodically synthesizes live temperature drift, relative humidity, distance, and container seal status every ~3 seconds (mimicking the ESP32 cadence).
- **Interactive Test Scenarios**: One-click test scenarios to verify system alerts:
  - **✓ Nominal (+4.5°C)**: Safe WHO cold chain envelope.
  - **▲ Heat Spike (+9.8°C)**: Triggers High Temperature Alert & audio alarm.
  - **▼ Freeze Alert (+1.2°C)**: Triggers Low Temperature Alert.
  - **🔓 Lid Breach (Open)**: Triggers Container Lid Breach Alert & distance expansion.
- **Safety First**: Clearly labels all readings as **SIMULATED** and **never writes simulated data to production Firebase**.

### 2. 📡 Live Hardware Mode (Firebase RTDB Stream)
- Subscribes directly to your cloud Firebase Realtime Database path (`/coldchain/latest`).
- Displays live sensor readings with server timestamps.
- **Reading Freshness Detection**: Automatically classifies readings as **LIVE** (&le;15s) or **STALE** (>15s) based on the ESP32 upload cadence.
- Never replaces missing or stale sensor readings with fabricated values.
- Displays clear diagnostics if Firebase is disconnected or data is unavailable.

---

## 📋 Telemetry Data Contract & ESP32 Format

When the ESP32 uploads data via HTTPS REST `PUT` to `https://<PROJECT-ID>-default-rtdb.<REGION>.firebasedatabase.app/coldchain/latest.json`, each upload replaces `/coldchain/latest`.

### JSON Payload Specification
```json
{
  "temperature": 5.2,
  "humidity": 68.0,
  "distance": 8.5,
  "lid": "closed",
  "timestamp": {
    ".sv": "timestamp"
  }
}
```

- `temperature` *(number, required)*: Temperature in degrees Celsius.
- `humidity` *(number, required)*: Relative humidity percentage.
- `distance` *(number, optional)*: Ultrasonic clearance measurement in centimetres.
- `lid` *(string, optional)*: Container lid state (`"open"` or `"closed"`). Field name `lidOpen` *(boolean)* is also supported.
- `timestamp` *(object/number, required)*: Firebase server timestamp placeholder `{\".sv\": \"timestamp\"}`, resolved into epoch milliseconds by Firebase.

---

## 🛠️ Environment Configuration & GitHub Publication

### 1. Environment Variables
This project uses Vite environment variables. Sensitive credentials should not be committed to GitHub.

Copy the example file to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your Firebase project credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Configurable Realtime Database Path (Default: coldchain/latest)
VITE_FIREBASE_DB_PATH=coldchain/latest
```

### 2. Git Configuration
The `.gitignore` file is preconfigured to prevent committing:
- `node_modules/`
- `dist/` build artifacts
- `.env` and `.env.local` credential files

---

## 📦 Installation & Run Commands

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build locally
npm run preview
```

The application will run at **`http://localhost:5173`**.

---

## 📟 ESP32 Microcontroller Firmware

Arduino firmware for the ESP32 is located at:
[`esp32_firmware/esp32_firmware.ino`](esp32_firmware/esp32_firmware.ino)

### Hardware Connections:
- **DHT11 (Temp & Humidity)**:
  - `VCC` &rarr; 3.3V or 5V
  - `GND` &rarr; GND
  - `DATA` &rarr; `GPIO 4`
- **HC-SR04 (Ultrasonic - Optional)**:
  - `TRIG` &rarr; `GPIO 5`
  - `ECHO` &rarr; `GPIO 18`
  - `VCC` &rarr; 5V
  - `GND` &rarr; GND

### Upload Instructions:
1. Open [`esp32_firmware/esp32_firmware.ino`](esp32_firmware/esp32_firmware.ino) in Arduino IDE.
2. Install the **DHT sensor library** and **Adafruit Unified Sensor** from the Library Manager.
3. Update your 2.4 GHz Wi-Fi SSID and Password in lines 35–36.
4. Select **ESP32 Dev Module** and flash via USB.

> **Status Notice:** Hardware integration is prepared and pending live physical ESP32 streaming confirmation. Web application functionality, threshold alarms, and charts have been verified using the Virtual Sensor Simulation harness and Firebase RTDB connectivity.
