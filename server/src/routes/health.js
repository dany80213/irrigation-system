const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "esp32-dashboard-server",
    time: new Date().toISOString(),
  });
});

module.exports = router;