/* ═══════════════════════════════════════════════════
   🌿  Irrigazione Smart — Frontend Logic
   ═══════════════════════════════════════════════════ */

const API = "";
const POLL_INTERVAL = 10_000;
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

/* ─── State ──────────────────────────────────────── */
let selectedDays = new Set();

/* ─── DOM refs ───────────────────────────────────── */
const $statusBadge = document.getElementById("status-badge");
const $statusText = $statusBadge.querySelector(".status-text");
const $deviceIp = document.getElementById("device-ip");
const $pumpState = document.getElementById("pump-state");
const $lastUpdate = document.getElementById("last-update");
const $manualFb = document.getElementById("manual-feedback");
const $timedFb = document.getElementById("timed-feedback");
const $scheduleFb = document.getElementById("schedule-feedback");
const $schedulesList = document.getElementById("schedules-list");
const $emptySchedules = document.getElementById("empty-schedules");
const $clock = document.getElementById("clock");

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initDaysPicker();
  fetchConfig();
  fetchStatus();
  setInterval(fetchStatus, POLL_INTERVAL);
  fetchSchedules();
});

/* ─── Clock ──────────────────────────────────────── */
function initClock() {
  function tick() {
    const now = new Date();
    const day = DAY_NAMES[now.getDay()];
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    $clock.textContent = `${day} ${dd}/${mm} — ${hh}:${mi}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ─── Days Picker ────────────────────────────────── */
function initDaysPicker() {
  document.querySelectorAll(".day-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const day = Number(btn.dataset.day);
      if (selectedDays.has(day)) {
        selectedDays.delete(day);
        btn.classList.remove("selected");
      } else {
        selectedDays.add(day);
        btn.classList.add("selected");
      }
    });
  });
}

/* ═══════════════════════════════════════════════════
   API — Config
   ═══════════════════════════════════════════════════ */
async function fetchConfig() {
  try {
    const res = await fetch(`${API}/api/config`);
    const json = await res.json();
    if (json.ok) {
      $deviceIp.textContent = json.espIp;
    }
  } catch {
    $deviceIp.textContent = "Errore";
  }
}

/* ═══════════════════════════════════════════════════
   API — Status polling
   ═══════════════════════════════════════════════════ */
async function fetchStatus() {
  try {
    const res = await fetch(`${API}/api/status`);
    const json = await res.json();

    if (json.ok) {
      $statusBadge.className = "status-badge online";
      $statusText.textContent = "Online";

      // Prova a mostrare lo stato della pompa dal payload
      const data = json.data;
      if (data && data.pump !== undefined) {
        $pumpState.textContent = data.pump === "on" ? "💧 Accesa" : "⏹️ Spenta";
        $pumpState.style.color = data.pump === "on" ? "var(--accent-green)" : "var(--text-secondary)";
      } else if (data && data.state !== undefined) {
        $pumpState.textContent = data.state === "on" ? "💧 Accesa" : "⏹️ Spenta";
        $pumpState.style.color = data.state === "on" ? "var(--accent-green)" : "var(--text-secondary)";
      } else {
        $pumpState.textContent = "Dati ricevuti";
      }
    } else {
      setOffline();
    }
  } catch {
    setOffline();
  }

  $lastUpdate.textContent = new Date().toLocaleTimeString("it-IT");
}

function setOffline() {
  $statusBadge.className = "status-badge offline";
  $statusText.textContent = "Offline";
  $pumpState.textContent = "Non disponibile";
  $pumpState.style.color = "var(--accent-red)";
}

/* ═══════════════════════════════════════════════════
   API — Manual Pump
   ═══════════════════════════════════════════════════ */
async function sendPump(state) {
  showFeedback($manualFb, `Invio comando ${state.toUpperCase()}…`, "info");

  try {
    const res = await fetch(`${API}/api/pump`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    const json = await res.json();

    if (json.ok) {
      showFeedback($manualFb, `✅ Pompa ${state === "on" ? "accesa" : "spenta"} con successo`, "success");
      fetchStatus();
    } else {
      showFeedback($manualFb, `❌ ${json.error}`, "error");
    }
  } catch (err) {
    showFeedback($manualFb, `❌ Errore di rete: ${err.message}`, "error");
  }
}

/* ═══════════════════════════════════════════════════
   API — Timed Irrigation
   ═══════════════════════════════════════════════════ */
async function sendTimedIrrigation() {
  const value = Number(document.getElementById("timed-value").value);
  const unit = document.getElementById("timed-unit").value;

  if (!value || value <= 0) {
    showFeedback($timedFb, "❌ Inserisci una durata valida", "error");
    return;
  }

  const durationSeconds = unit === "min" ? value * 60 : value;

  if (durationSeconds > 7200) {
    showFeedback($timedFb, "❌ Durata massima: 2 ore (7200 secondi)", "error");
    return;
  }

  showFeedback($timedFb, "Avvio irrigazione a tempo…", "info");

  try {
    const res = await fetch(`${API}/api/pump/timed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationSeconds }),
    });
    const json = await res.json();

    if (json.ok) {
      const label = unit === "min" ? `${value} minuti` : `${value} secondi`;
      showFeedback($timedFb, `✅ Irrigazione avviata per ${label}`, "success");
      fetchStatus();
    } else {
      showFeedback($timedFb, `❌ ${json.error}`, "error");
    }
  } catch (err) {
    showFeedback($timedFb, `❌ Errore di rete: ${err.message}`, "error");
  }
}

/* ═══════════════════════════════════════════════════
   API — Schedules
   ═══════════════════════════════════════════════════ */
async function fetchSchedules() {
  try {
    const res = await fetch(`${API}/api/schedules`);
    const json = await res.json();
    if (json.ok) {
      renderSchedules(json.data);
    }
  } catch {
    // Silenzioso
  }
}

async function addSchedule() {
  const days = [...selectedDays];
  const time = document.getElementById("schedule-time").value;
  const durationMinutes = Number(document.getElementById("schedule-duration").value);

  if (days.length === 0) {
    showFeedback($scheduleFb, "❌ Seleziona almeno un giorno", "error");
    return;
  }
  if (!time) {
    showFeedback($scheduleFb, "❌ Inserisci un orario", "error");
    return;
  }
  if (!durationMinutes || durationMinutes <= 0) {
    showFeedback($scheduleFb, "❌ Inserisci una durata valida", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/api/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, time, durationMinutes }),
    });
    const json = await res.json();

    if (json.ok) {
      showFeedback($scheduleFb, "✅ Programmazione aggiunta", "success");
      // Reset form
      selectedDays.clear();
      document.querySelectorAll(".day-btn").forEach((b) => b.classList.remove("selected"));
      fetchSchedules();
    } else {
      showFeedback($scheduleFb, `❌ ${json.error}`, "error");
    }
  } catch (err) {
    showFeedback($scheduleFb, `❌ Errore di rete: ${err.message}`, "error");
  }
}

async function toggleSchedule(id, currentEnabled) {
  try {
    await fetch(`${API}/api/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !currentEnabled }),
    });
    fetchSchedules();
  } catch {
    showFeedback($scheduleFb, "❌ Errore aggiornamento", "error");
  }
}

async function deleteSchedule(id) {
  try {
    await fetch(`${API}/api/schedules/${id}`, { method: "DELETE" });
    fetchSchedules();
  } catch {
    showFeedback($scheduleFb, "❌ Errore eliminazione", "error");
  }
}

/* ─── Render schedules list ──────────────────────── */
function renderSchedules(schedules) {
  // Clear existing items (keep empty msg)
  $schedulesList.querySelectorAll(".schedule-item").forEach((el) => el.remove());

  if (!schedules || schedules.length === 0) {
    $emptySchedules.style.display = "block";
    return;
  }

  $emptySchedules.style.display = "none";

  schedules.forEach((s) => {
    const daysLabel = s.days
      .sort((a, b) => a - b)
      .map((d) => DAY_NAMES[d])
      .join(", ");

    const item = document.createElement("div");
    item.className = `schedule-item${s.enabled ? "" : " disabled"}`;
    item.innerHTML = `
      <div class="schedule-info">
        <div class="schedule-time">🕐 ${s.time}</div>
        <div class="schedule-days">${daysLabel}</div>
        <div class="schedule-duration">⏱ ${s.durationMinutes} min</div>
      </div>
      <div class="schedule-actions">
        <button class="btn btn-sm btn-toggle ${s.enabled ? "active" : ""}"
                onclick="toggleSchedule('${s.id}', ${s.enabled})">
          ${s.enabled ? "ON" : "OFF"}
        </button>
        <button class="btn btn-sm btn-delete" onclick="deleteSchedule('${s.id}')">
          🗑️
        </button>
      </div>
    `;
    $schedulesList.appendChild(item);
  });
}

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */
function showFeedback(el, msg, type) {
  el.textContent = msg;
  el.className = `feedback ${type}`;
  if (type !== "info") {
    setTimeout(() => {
      el.textContent = "";
      el.className = "feedback";
    }, 5000);
  }
}
