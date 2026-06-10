const express = require("express");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

function proxy(targetBase) {
  return (req, res) => {
    const url = `${targetBase}?${new URLSearchParams(req.query)}`;
    https
      .get(url, { headers: { "User-Agent": "WeatherDashboard/1.0" } }, (apiRes) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");
        apiRes.pipe(res);
      })
      .on("error", (err) => {
        res.status(502).json({ error: "API недоступен", details: err.message });
      });
  };
}

app.get("/api/geo", proxy("https://geocoding-api.open-meteo.com/v1/search"));
app.get("/api/weather", proxy("https://api.open-meteo.com/v1/forecast"));
app.get("/api/reverse", proxy("https://nominatim.openstreetmap.org/reverse"));

app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));
