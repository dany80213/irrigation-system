const fs = require("fs");
const path = require("path");
const { setPumpState } = require("./espClient");

const SCHEDULES_PATH = path.join(__dirname, "data", "schedules.json");
const CHECK_INTERVAL_MS = 30_000; // 30 secondi

// Tiene traccia delle schedulazioni già eseguite in questo minuto
// Formato: Set<"scheduleId-YYYY-MM-DDTHH:MM">
const executedToday = new Set();

/**
 * Legge le schedulazioni dal file JSON
 */
function loadSchedules() {
  try {
    const raw = fs.readFileSync(SCHEDULES_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Avvia la pompa per la durata specificata, poi la spegne
 */
async function runTimedIrrigation(durationMinutes, label = "scheduler") {
  const durationMs = durationMinutes * 60 * 1000;

  console.log(`[${label}] Pompa ON per ${durationMinutes} min`);

  try {
    await setPumpState("on", durationMs);
  } catch (err) {
    console.error(`[${label}] Errore avvio pompa:`, err.message);
    return;
  }
}

/**
 * Controlla le programmazioni e avvia l'irrigazione se necessario
 */
function checkSchedules() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Domenica ... 6 = Sabato
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const minuteKey = `${now.toISOString().slice(0, 10)}T${currentTime}`;

  const schedules = loadSchedules();

  for (const schedule of schedules) {
    if (!schedule.enabled) continue;
    if (!schedule.days.includes(currentDay)) continue;
    if (schedule.time !== currentTime) continue;

    const execKey = `${schedule.id}-${minuteKey}`;
    if (executedToday.has(execKey)) continue;

    executedToday.add(execKey);
    runTimedIrrigation(schedule.durationMinutes, `schedule:${schedule.id}`);
  }

  // Pulizia chiavi vecchie (più di 24h)
  const yesterday = new Date(now.getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  for (const key of executedToday) {
    if (key.includes(yesterday)) {
      executedToday.delete(key);
    }
  }
}

/**
 * Avvia il loop dello scheduler
 */
function startScheduler() {
  console.log("[scheduler] Avviato — controllo ogni 30s");
  setInterval(checkSchedules, CHECK_INTERVAL_MS);
}

module.exports = { startScheduler, runTimedIrrigation };
