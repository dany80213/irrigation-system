# ⚡ Firmware -- ESP32 Irrigation Controller

This firmware runs on the ESP32 and directly controls the irrigation
pump.

------------------------------------------------------------------------

# 🧠 Responsibilities

The ESP32:

-   Controls pump on GPIO 27
-   Exposes minimal HTTP API
-   Maintains pump state
-   Executes commands received from Node.js

It does NOT handle scheduling logic.

------------------------------------------------------------------------

# 🔌 Hardware Setup

-   ESP32 board
-   Relay module
-   Water pump
-   GPIO 27 → Relay input

Safety note:

Pump is initialized to OFF at boot to prevent accidental activation.

------------------------------------------------------------------------

# 🌐 HTTP Endpoints

## Get Status

GET /status

Response:

{ "state": "idle" }

Possible states:

-   idle
-   on
-   off

------------------------------------------------------------------------

## Control Pump

POST /pump

Body:

{ "state": "on" }

or

{ "state": "off" }

Returns updated state.

------------------------------------------------------------------------

# 🔄 Internal State Machine

Initial state: idle

Transitions:

idle → on\
on → off\
off → on

------------------------------------------------------------------------

# 📦 Dependencies

-   WiFi.h
-   WebServer.h
-   ArduinoJson

------------------------------------------------------------------------

# ⚙️ Configuration

Edit firmware to set:

-   WiFi SSID
-   WiFi Password

------------------------------------------------------------------------

# 🚀 Future Improvements

-   Local fail-safe timeout
-   OTA firmware update
-   Watchdog reset handling
-   Sensor integration (moisture / flow)
-   HTTPS support
