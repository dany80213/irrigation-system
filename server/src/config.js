const dotenv = require("dotenv");

// Carica le variabili dal file .env dentro process.env
dotenv.config();



function mustGet(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}


const config = {
  port: Number(process.env.PORT || 3000),
  espBaseUrl: mustGet("ESP32_BASE_URL"),
};

module.exports = { config };