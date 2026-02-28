#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// ====== CONFIG WIFI ======
const char* ssid = "";
const char* password = "";

// ====== PIN ======
const int pumpPin = 27;

// ====== SERVER ======
WebServer server(80);

// ====== STATO ======
String pumpState = "idle";  // idle | on | off
uint32_t durationMs = -1;
uint32_t now;
uint32_t pumpOffAtMs;
bool pumpOn = false;

// ====== HANDLER STATUS ======
void handleStatus() {
  StaticJsonDocument<200> doc;
  doc["state"] = pumpState;

  String response;
  serializeJson(doc, response);

  server.send(200, "application/json", response);
}

// ====== HANDLER PUMP ======
void handlePump() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method not allowed\"}");
    return;
  }

  // Legge il body JSON
  String body = server.arg("plain");

  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, body);

  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }

  String state = doc["state"];
  uint32_t  durationJson = doc["durationMs"];
  //const char* durationStr = doc["durationMs"];
  if (!durationJson) {
    durationMs = -1;
  }else{
    durationMs = durationJson;
  }



  
  

  if (state == "on") {
    digitalWrite(pumpPin, HIGH);
    pumpState = "on";
    now = millis();
    pumpOn = true;
    pumpOffAtMs = now + durationMs;
  } 
  else if (state == "off") {
    digitalWrite(pumpPin, LOW);
    pumpState = "off";
    pumpOn = false;
  } 
  else {
    server.send(400, "application/json", "{\"error\":\"Invalid state\"}");
    return;
  }

  StaticJsonDocument<200> responseDoc;
  responseDoc["state"] = pumpState;

  String response;
  serializeJson(responseDoc, response);

  server.send(200, "application/json", response);
}

void setup() {
  Serial.begin(115200);

  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());

  // Routes
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/pump", HTTP_POST, handlePump);

  server.begin();
}

void loop() {
  server.handleClient();

  if(pumpOn && (int32_t)(millis() - pumpOffAtMs) >= 0 && durationMs != -1){
    digitalWrite(pumpPin, LOW);
    pumpOn = false;
    pumpState = "off";
  }


}