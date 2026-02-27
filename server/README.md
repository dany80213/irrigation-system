# 🌐 Server -- Smart Irrigation Backend (Node.js)

This is the backend server for the Smart Irrigation System.

It acts as:

-   API gateway for the frontend
-   Proxy between browser and ESP32
-   Scheduler engine
-   Timed irrigation controller
-   Schedule persistence manager

------------------------------------------------------------------------

# 🏗 Responsibilities

The server:

-   Exposes REST API endpoints
-   Validates all incoming requests
-   Forwards commands to the ESP32
-   Executes timed irrigation
-   Manages weekly schedules
-   Stores schedules in a JSON file

The ESP32 does NOT manage scheduling logic --- all automation runs here.

------------------------------------------------------------------------

# 📡 API Endpoints

## Health Check

GET /health

Returns server status.

------------------------------------------------------------------------

## Get Pump Status

GET /api/status

Response:

{ "ok": true, "data": { "state": "on" } }

------------------------------------------------------------------------

## Manual Pump Control

POST /api/pump

Body:

{ "state": "on" }

or

{ "state": "off" }

------------------------------------------------------------------------

## Timed Irrigation

POST /api/pump/timed

Body:

{ "durationSeconds": 600 }

-   Minimum: 1 second
-   Maximum: 7200 seconds (2 hours)

The server automatically turns the pump off after the timer expires.

------------------------------------------------------------------------

## Schedule Management (CRUD)

Schedules are stored in:

/src/data/schedules.json

### Get All Schedules

GET /api/schedules

### Create Schedule

POST /api/schedules

{ "days": \[1,3,5\], "time": "07:00", "durationMinutes": 10, "enabled":
true }

### Update Schedule

PUT /api/schedules/:id

### Delete Schedule

DELETE /api/schedules/:id

------------------------------------------------------------------------

# ⏱ Scheduler Engine

-   Runs every 30 seconds
-   Checks day + time match
-   Prevents duplicate execution in same minute
-   Executes timed irrigation automatically

------------------------------------------------------------------------

# 📂 Folder Structure

/src index.js config.js espClient.js scheduler.js /routes api.js
health.js /data schedules.json

------------------------------------------------------------------------
