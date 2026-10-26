/*
  ==============================================================
  Cold Chain Integrity Monitor - ESP32 Firmware
  Sensors:
    - DHT11 (Temperature & Humidity) on GPIO 4
    - HC-SR04 Ultrasonic Sensor (Distance & Lid Open/Close detection)
        TRIG Pin -> GPIO 5
        ECHO Pin -> GPIO 18
  Backend:
    - Firebase Realtime Database (HTTPS REST PUT)
    - Embedded Local HTTP Web Server
  ==============================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <math.h>

// -------- SENSOR PINS --------
#define DHTPIN 4
#define DHTTYPE DHT11

// HC-SR04 Ultrasonic Pins
#define TRIG_PIN 5
#define ECHO_PIN 18

// Distance threshold for Lid Open / Closed (in centimeters)
// When distance > LID_OPEN_THRESHOLD_CM, lid is considered OPEN.
const float LID_OPEN_THRESHOLD_CM = 15.0;

// -------- YOUR WI-FI CREDENTIALS --------
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// -------- FIREBASE CONFIGURATION --------
const char* firebaseURL =
  "https://coldchain-integrity-nonitor-default-rtdb.asia-southeast1.firebasedatabase.app/coldchain/latest.json";

DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

float temp = NAN;
float hum = NAN;
float distanceCm = NAN;
bool isLidOpen = false;

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 3000; // 3 seconds

// -------- READ ULTRASONIC SENSOR --------
float readUltrasonicDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read the pulse duration on ECHO pin (timeout 30ms = ~5m max distance)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) {
    return NAN; // Timeout or sensor disconnected
  }

  // Speed of sound = 343 m/s = 0.0343 cm/microsecond. Divide by 2 for round-trip.
  float dist = (duration * 0.0343) / 2.0;
  return dist;
}

// -------- FIREBASE UPLOAD FUNCTION --------
void uploadToFirebase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Firebase upload skipped.");
    return;
  }

  if (isnan(temp) || isnan(hum)) {
    Serial.println("Invalid DHT readings. Upload skipped.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Prototype mode: disables TLS certificate validation

  HTTPClient https;
  if (!https.begin(client, firebaseURL)) {
    Serial.println("Could not start HTTPS connection to Firebase.");
    return;
  }

  https.addHeader("Content-Type", "application/json");

  // Format JSON payload matching data contract:
  String jsonData = "{";
  jsonData += "\"temperature\":" + String(temp, 1) + ",";
  jsonData += "\"humidity\":" + String(hum, 1) + ",";
  // If HC-SR04 ultrasonic sensor is connected and reads valid distance, include it:
  if (!isnan(distanceCm)) {
    jsonData += "\"distance\":" + String(distanceCm, 1) + ",";
    jsonData += "\"lid\":\"" + String(isLidOpen ? "open" : "closed") + "\",";
  }
  jsonData += "\"timestamp\":{\".sv\":\"timestamp\"}";
  jsonData += "}";

  Serial.println("Uploading telemetry to Firebase...");
  Serial.println(jsonData);

  int httpCode = https.PUT(jsonData);

  if (httpCode > 0) {
    Serial.print("Firebase HTTP response: ");
    Serial.println(httpCode);
    if (httpCode == HTTP_CODE_OK) {
      Serial.println("Telemetry upload successful!");
    } else {
      Serial.println("Firebase returned: " + https.getString());
    }
  } else {
    Serial.print("HTTPS request failed: ");
    Serial.println(https.errorToString(httpCode));
  }

  https.end();
}

// -------- LOCAL WEB DASHBOARD --------
void handleRoot() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<meta http-equiv='refresh' content='3'>";
  html += "<title>Cold Chain ESP32 Node</title>";
  html += "<style>";
  html += "body{font-family:Arial,sans-serif;background:#090d16;color:#f8fafc;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}";
  html += ".card{background:#131c2e;padding:2rem;border-radius:18px;width:340px;border:1px solid #1e293b;box-shadow:0 10px 30px rgba(0,0,0,0.5)}";
  html += "h1{font-size:1.2rem;color:#38bdf8;margin-top:0}";
  html += ".metric{margin:18px 0;padding:12px;background:#0a0f1d;border-radius:12px}";
  html += ".label{font-size:.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}";
  html += ".val{font-size:1.8rem;font-weight:bold;margin-top:4px}";
  html += ".footer{font-size:.75rem;color:#64748b;margin-top:16px;text-align:center}";
  html += "</style></head><body>";
  html += "<div class='card'>";
  html += "<h1>ESP32 Cold Chain Node</h1>";
  
  html += "<div class='metric'><div class='label'>Temperature</div><div class='val' style='color:#f87171'>";
  html += isnan(temp) ? "--" : String(temp, 1);
  html += " &deg;C</div></div>";

  html += "<div class='metric'><div class='label'>Humidity</div><div class='val' style='color:#38bdf8'>";
  html += isnan(hum) ? "--" : String(hum, 1);
  html += " %</div></div>";

  html += "<div class='metric'><div class='label'>Distance (Ultrasonic)</div><div class='val' style='color:#c084fc'>";
  html += isnan(distanceCm) ? "--" : String(distanceCm, 1);
  html += " cm</div></div>";

  html += "<div class='metric'><div class='label'>Lid Status</div><div class='val' style='color:" + String(isLidOpen ? "#f87171" : "#34d399") + "'>";
  html += isLidOpen ? "LID OPEN (BREACH)" : "LID CLOSED (SECURE)";
  html += "</div></div>";

  html += "<div class='footer'>ESP32 Node &bull; Synced with Firebase RTDB</div>";
  html += "</div></body></html>";

  server.send(200, "text/html", html);
}

// -------- SETUP --------
void setup() {
  Serial.begin(115200);
  dht.begin();

  // Setup Ultrasonic pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.println();
  Serial.println("Starting Cold Chain Integrity Node...");
  Serial.println("Connecting to Wi-Fi...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi connected!");
  Serial.print("Local IP Address: http://");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.begin();
  Serial.println("Web server started.");
  Serial.println("Firebase RTDB sync active.");
}

// -------- MAIN LOOP --------
void loop() {
  server.handleClient();

  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;

    float newTemp = dht.readTemperature();
    float newHum = dht.readHumidity();
    float newDist = readUltrasonicDistance();

    if (!isnan(newTemp) && !isnan(newHum)) {
      temp = newTemp;
      hum = newHum;
      if (!isnan(newDist)) {
        distanceCm = newDist;
        isLidOpen = (distanceCm > LID_OPEN_THRESHOLD_CM);
      }

      Serial.print("Temp: "); Serial.print(temp); Serial.print(" C | ");
      Serial.print("Hum: "); Serial.print(hum); Serial.print(" % | ");
      Serial.print("Dist: "); Serial.print(distanceCm); Serial.print(" cm | ");
      Serial.print("Lid: "); Serial.println(isLidOpen ? "OPEN" : "CLOSED");

      uploadToFirebase();
    } else {
      Serial.println("Failed to read DHT11. Check wiring.");
    }
  }
}
