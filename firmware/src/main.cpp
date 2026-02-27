#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// ===== WiFi config =====
const char* ssid = "TUO_WIFI";
const char* password = "TUA_PASSWORD";

// ===== Hardware =====
static const int PUMP_PIN = 27;

// ===== HTTP server =====
WebServer server(80);

// ===== State =====
String pumpState = "idle"; // idle | on | off

void sendJson(int code, const JsonDocument& doc) {
  String out;
  serializeJson(doc, out);
  server.send(code, "application/json", out);
}

void handleStatus() {
  StaticJsonDocument<128> doc;
  doc["state"] = pumpState;
  sendJson(200, doc);
}

void handlePump() {
  // Expect: POST /pump with JSON {"state":"on"|"off"}
  if (server.method() != HTTP_POST) {
    StaticJsonDocument<128> doc;
    doc["error"] = "Method not allowed";
    sendJson(405, doc);
    return;
  }

  const String body = server.arg("plain");

  StaticJsonDocument<256> in;
  const auto err = deserializeJson(in, body);
  if (err) {
    StaticJsonDocument<128> doc;
    doc["error"] = "Invalid JSON";
    sendJson(400, doc);
    return;
  }

  const char* state = in["state"];
  if (!state) {
    StaticJsonDocument<128> doc;
    doc["error"] = "Missing 'state'";
    sendJson(400, doc);
    return;
  }

  if (strcmp(state, "on") == 0) {
    digitalWrite(PUMP_PIN, HIGH);
    pumpState = "on";
  } else if (strcmp(state, "off") == 0) {
    digitalWrite(PUMP_PIN, LOW);
    pumpState = "off";
  } else {
    StaticJsonDocument<160> doc;
    doc["error"] = "Invalid state";
    doc["allowed"][0] = "on";
    doc["allowed"][1] = "off";
    sendJson(400, doc);
    return;
  }

  StaticJsonDocument<128> out;
  out["state"] = pumpState;
  sendJson(200, out);
}

void setup() {
  Serial.begin(115200);

  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW); // fail-safe

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  server.on("/status", HTTP_GET, handleStatus);
  server.on("/pump", HTTP_POST, handlePump);

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}