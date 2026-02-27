const express = require("express");
const path = require("path");
const { config } = require("./config");
const { startScheduler } = require("./scheduler");

const apiRouter = require("./routes/api");
const healthRouter = require("./routes/health");

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api", apiRouter);

app.use(express.static(path.join(__dirname, "public")));

app.listen(config.port, () => {
  console.log(`Server running: http://localhost:${config.port}`);
  console.log(`ESP32 base URL: ${config.espBaseUrl}`);
  startScheduler();
});