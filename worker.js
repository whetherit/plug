// Cloudflare Worker — прокси для обхода блокировок в РФ
// Деплой: https://dash.cloudflare.com → Workers → Create → вставить этот код

const ROUTES = {
  "/geo":     "https://geocoding-api.open-meteo.com/v1/search",
  "/weather": "https://api.open-meteo.com/v1/forecast",
  "/reverse": "https://nominatim.openstreetmap.org/reverse",
};

export default {
  async fetch(request) {
    const { pathname, search } = new URL(request.url);
    const target = ROUTES[pathname];

    if (!target) {
      return new Response("Not found", { status: 404 });
    }

    const response = await fetch(target + search, {
      headers: { "User-Agent": "WeatherDashboard/1.0" },
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
