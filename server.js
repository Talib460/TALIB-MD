const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🔥 TALIB-MD BOT RUNNING");
});

app.listen(3000, () => console.log("Server running"));