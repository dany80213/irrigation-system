const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getStatus, setPumpState } = require("../espClient");
const { config } = require("../config");
const { runTimedIrrigation } = require("../scheduler");

const router = express.Router();
const SCHEDULES_PATH = path.join(__dirname, "..", "data", "schedules.json");

/* ─── helpers ─────────────────────────────────────── */
function loadSchedules() {
  try {
    return JSON.parse(fs.readFileSync(SCHEDULES_PATH, "utf-8"));
  } catch {
    return [];
  }
}
function saveSchedules(data) {
  fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(data, null, 2));
}

/* ─── GET /api/config ────────────────────────────── */
router.get("/config", (req, res) => {
  res.json({ ok: true, espIp: config.espBaseUrl });
});

/* ─── GET /api/status ────────────────────────────── */
router.get("/status", async (req, res) => {
  try {
    const data = await getStatus();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/* ─── POST /api/pump  { state: "on"|"off" } ─────── */
router.post("/pump", async (req, res) => {
  try {
    const { state } = req.body || {};
    if (state !== "on" && state !== "off") {
      return res.status(400).json({
        ok: false,
        error: "Invalid body. Expected: { state: 'on' | 'off' }",
        received: req.body,
      });
    }
    const data = await setPumpState(state);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/* ─── POST /api/pump/timed  { durationSeconds: N } ─ */
router.post("/pump/timed", async (req, res) => {
  try {
    const { durationSeconds } = req.body || {};
    if (!durationSeconds || durationSeconds <= 0 || durationSeconds > 7200) {
      return res.status(400).json({
        ok: false,
        error: "durationSeconds deve essere tra 1 e 7200",
      });
    }
    const durationMinutes = durationSeconds / 60;
    runTimedIrrigation(durationMinutes, "timed-manual");
    res.json({ ok: true, message: `Pompa accesa per ${durationSeconds}s` });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/* ─── SCHEDULES CRUD ─────────────────────────────── */

// GET /api/schedules
router.get("/schedules", (req, res) => {
  res.json({ ok: true, data: loadSchedules() });
});

// POST /api/schedules
router.post("/schedules", (req, res) => {
  const { days, time, durationMinutes, enabled } = req.body || {};

  if (!Array.isArray(days) || days.length === 0) {
    return res.status(400).json({ ok: false, error: "days è obbligatorio (array)" });
  }
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ ok: false, error: "time è obbligatorio (HH:MM)" });
  }
  if (!durationMinutes || durationMinutes <= 0) {
    return res.status(400).json({ ok: false, error: "durationMinutes deve essere > 0" });
  }

  const schedule = {
    id: crypto.randomUUID(),
    days,
    time,
    durationMinutes: Number(durationMinutes),
    enabled: enabled !== false,
  };

  const schedules = loadSchedules();
  schedules.push(schedule);
  saveSchedules(schedules);

  res.status(201).json({ ok: true, data: schedule });
});

// PUT /api/schedules/:id
router.put("/schedules/:id", (req, res) => {
  const schedules = loadSchedules();
  const idx = schedules.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ ok: false, error: "Schedule non trovata" });
  }

  const updates = req.body || {};
  if (updates.days !== undefined) schedules[idx].days = updates.days;
  if (updates.time !== undefined) schedules[idx].time = updates.time;
  if (updates.durationMinutes !== undefined) schedules[idx].durationMinutes = Number(updates.durationMinutes);
  if (updates.enabled !== undefined) schedules[idx].enabled = updates.enabled;

  saveSchedules(schedules);
  res.json({ ok: true, data: schedules[idx] });
});

// DELETE /api/schedules/:id
router.delete("/schedules/:id", (req, res) => {
  let schedules = loadSchedules();
  const before = schedules.length;
  schedules = schedules.filter((s) => s.id !== req.params.id);

  if (schedules.length === before) {
    return res.status(404).json({ ok: false, error: "Schedule non trovata" });
  }

  saveSchedules(schedules);
  res.json({ ok: true });
});

module.exports = router;