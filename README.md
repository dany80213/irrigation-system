[![PlatformIO](https://img.shields.io/badge/PlatformIO-ESP32-orange)]
[![Framework](https://img.shields.io/badge/framework-Arduino-blue)]
[![Node.js](https://img.shields.io/badge/node-18%2B-green)]
[![License](https://img.shields.io/badge/license-MIT-blue)]

# Smart Irrigation System -- ESP32 + Node.js

A modular and scalable smart irrigation system built with:

-   **ESP32 (Arduino framework via PlatformIO)**
-   **Node.js backend server**
-   REST API architecture
-   Weekly scheduler engine
-   Timed irrigation control

------------------------------------------------------------------------

# System Architecture

    +------------------+
    |   Browser / UI   |
    +------------------+
              |
              v
    +------------------+
    |  Node.js Server  |
    |  - REST API      |
    |  - Scheduler     |
    |  - Validation    |
    +------------------+
              |
              v
    +------------------+
    |      ESP32       |
    |  - HTTP Server   |
    |  - GPIO Control  |
    +------------------+
              |
              v
         GPIO 27 → Relay → Pump

------------------------------------------------------------------------

# Responsibilities

## ESP32 (Firmware)

-   Controls pump on GPIO 27
-   Exposes minimal HTTP API
-   Maintains pump state
-   Executes commands from backend
-   Does NOT manage scheduling logic

## Node.js Server

-   Exposes REST API
-   Validates client requests
-   Proxies commands to ESP32
-   Runs scheduler loop
-   Manages timed irrigation
-   Stores schedules in JSON file

------------------------------------------------------------------------

# API Reference

Base path: `/api`

------------------------------------------------------------------------

## Health Check

  Method   Endpoint   Description
  -------- ---------- -----------------------
  GET      /health    Returns server status

------------------------------------------------------------------------

## Pump Status

  Method   Endpoint      Description
  -------- ------------- ----------------------------
  GET      /api/status   Returns current pump state

### Response

``` json
{
  "ok": true,
  "data": {
    "state": "on"
  }
}
```

Possible states:

-   `idle`
-   `on`
-   `off`

------------------------------------------------------------------------

## Manual Pump Control

  Method   Endpoint    Body                 Description
  -------- ----------- -------------------- ---------------
  POST     /api/pump   { "state": "on" }    Turn pump ON
  POST     /api/pump   { "state": "off" }   Turn pump OFF

------------------------------------------------------------------------

## Timed Irrigation

  --------------------------------------------------------------------------
  Method   Endpoint           Body                             Description
  -------- ------------------ -------------------------------- -------------
  POST     /api/pump/timed    { "durationSeconds": 600 }       Run pump for
                                                               fixed
                                                               duration

  --------------------------------------------------------------------------

Constraints:

-   Minimum: 1 second
-   Maximum: 7200 seconds (2 hours)

------------------------------------------------------------------------

## Schedule Management

Schedules are stored in:

`/server/src/data/schedules.json`

### Schedule Object

``` json
{
  "id": "uuid",
  "days": [1, 3, 5],
  "time": "07:00",
  "durationMinutes": 10,
  "enabled": true
}
```

  Field             Description
  ----------------- ------------------------------
  days              0--6 (Sunday--Saturday)
  time              HH:MM (24h format)
  durationMinutes   Irrigation duration
  enabled           Activate/deactivate schedule

------------------------------------------------------------------------

### Schedule Endpoints

  Method   Endpoint             Description
  -------- -------------------- -------------------
  GET      /api/schedules       Get all schedules
  POST     /api/schedules       Create schedule
  PUT      /api/schedules/:id   Update schedule
  DELETE   /api/schedules/:id   Delete schedule

Scheduler runs every 30 seconds.

------------------------------------------------------------------------

# PlatformIO Firmware Implementation

Firmware is located in:

    /firmware

## platformio.ini

    [env:esp32dev]
    platform = espressif32
    board = esp32dev
    framework = arduino

    monitor_speed = 115200

    lib_deps =
      bblanchon/ArduinoJson@^6.21.0

Built-in (no lib_deps required):

-   WiFi.h
-   WebServer.h

------------------------------------------------------------------------

## Build & Upload

Using VS Code + PlatformIO extension:

-   Build
-   Upload
-   Monitor

Or via CLI:

    cd firmware
    pio run
    pio run -t upload
    pio device monitor

------------------------------------------------------------------------

# Project Structure

    /firmware
        platformio.ini
        /src
            main.cpp

    /server
        /src
            index.js
            config.js
            espClient.js
            scheduler.js
            /routes
                api.js
                health.js
            /data
                schedules.json

    README.md

------------------------------------------------------------------------

# Security Model

-   ESP32 is not exposed directly to the internet
-   Browser communicates only with Node.js
-   Server validates all inputs
-   Ready for future HTTPS and authentication

