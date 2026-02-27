const { config } = require("./config");

async function getStatus() {
  const res = await fetch(`${config.espBaseUrl}/status`);

  if (!res.ok) {
    throw new Error(`ESP32 error ${res.status}`);
  }

  return res.json();
}

async function setPumpState(state) {
  if (state !== "on" && state !== "off") {
    throw new Error("Invalid pump state");
  }

  const res = await fetch(`${config.espBaseUrl}/pump`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ state })
  });

  if (!res.ok) {
    throw new Error(`ESP32 error ${res.status}`);
  }

  return res.json();
}

module.exports = { getStatus, setPumpState };