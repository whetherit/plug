import {
  WTTR_URL,
  GEO_URL,
  getWeatherDescription,
  setupUnitToggle,
  getSavedCities,
  saveCities,
  setupThemeToggle,
  getWeatherTheme,
} from "./script.js";

const params = new URLSearchParams(window.location.search);
const cityName = params.get("city") || "Москва";
const cityLat = params.get("lat");
const cityLon = params.get("lon");

const cityEl = document.querySelector(".weather__city");
const tempEl = document.querySelector(".weather__temper");
const wthrEl = document.querySelector(".weather__wthr");
const forecastGrid = document.querySelector(".six-days-grid");
const detailsGrid = document.querySelector(".card-grid");
const backBtn = document.querySelector(".back-btn");
const favBtn = document.querySelector(".favorite-btn");
let currentUnit = localStorage.getItem("weather_unit") || "C";
let weatherDataCache = null;

function getWeatherEmoji(code) {
  if (code === 113) return "☀️";
  if ([116, 119].includes(code)) return "⛅";
  if ([122, 143, 248, 260].includes(code)) return "☁️";
  if ([200, 386, 389, 392, 395].includes(code)) return "⛈";
  if ([179, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371].includes(code)) return "🌨";
  if ([176, 353, 356, 359, 362, 365].includes(code)) return "🌦";
  return "🌧";
}

function formatTemp(celsius) {
  if (celsius === null || celsius === undefined) return "—";
  if (currentUnit === "F") return `${Math.round(celsius * 1.8 + 32)}°F`;
  return `${Math.round(celsius)}°C`;
}

function getCurrentHourlySlot(hourly) {
  const currentHour = new Date().getHours();
  let best = 0;
  for (let i = 0; i < hourly.length; i++) {
    if (parseInt(hourly[i].time) / 100 <= currentHour) best = i;
  }
  return best;
}

setupUnitToggle((newUnit) => {
  currentUnit = newUnit;
  if (weatherDataCache) {
    const current = weatherDataCache.current_condition[0];
    const hourly = weatherDataCache.weather[0].hourly;
    renderTemperatures(current);
    renderDetails(current, hourly);
    renderForecast(weatherDataCache.weather);
    renderHourlyForecast(weatherDataCache.weather);
  }
});

backBtn.addEventListener("click", () => {
  if (document.referrer && document.referrer.includes("index.html")) {
    history.back();
  } else {
    window.location.href = "index.html";
  }
});

favBtn.addEventListener("click", () => {
  let saved = getSavedCities();
  saved = saved.filter((c) => c.toLowerCase() !== cityName.toLowerCase());
  saveCities(saved);
  favBtn.textContent = "Удалено";
  favBtn.disabled = true;
  favBtn.style.opacity = "0.6";
});

async function loadAllData() {
  try {
    // Если есть координаты в URL — используем их, иначе геокодируем
    let lat = cityLat;
    let lon = cityLon;

    if (!lat || !lon) {
      const geoRes = await fetch(
        `${GEO_URL}?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`,
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length) throw new Error("Город не найден");
      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
    }

    const res = await fetch(`${WTTR_URL}/${lat},${lon}?format=j1`);
    if (!res.ok) throw new Error("Ошибка загрузки погоды");

    weatherDataCache = await res.json();
    const current = weatherDataCache.current_condition[0];
    const hourly = weatherDataCache.weather[0].hourly;

    cityEl.textContent = cityName;
    document.title = `${cityName} / Панель погоды`;

    renderTemperatures(current);
    renderDetails(current, hourly);
    renderForecast(weatherDataCache.weather);
    renderHourlyForecast(weatherDataCache.weather);

    const saved = getSavedCities();
    if (saved.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
      favBtn.textContent = "Удалить из избранного";
      favBtn.disabled = false;
      favBtn.style.opacity = "1";
    } else {
      favBtn.textContent = "Не в избранном";
      favBtn.disabled = true;
      favBtn.style.opacity = "0.6";
    }
  } catch (err) {
    cityEl.textContent = "Ошибка";
    wthrEl.textContent = err.message;
    console.error(err);
    document.querySelector(".hourly-card")?.remove();
    if (detailsGrid) {
      detailsGrid.innerHTML =
        '<li class="card"><span class="card__context">Не удалось загрузить данные</span></li>';
    }
  }
}

function renderTemperatures(current) {
  const temp = parseFloat(current.temp_C);
  tempEl.textContent = formatTemp(temp);
  tempEl.value = temp;
  wthrEl.textContent = getWeatherDescription(parseInt(current.weatherCode));

  const mainEl = document.querySelector("main");
  if (mainEl) {
    mainEl.classList.remove("theme-sunny", "theme-cloudy", "theme-rainy", "theme-snowy");
    mainEl.classList.add(getWeatherTheme(parseInt(current.weatherCode)));
  }
}

function renderDetails(current, hourly) {
  const cards = detailsGrid.querySelectorAll(".card");
  const slotIdx = getCurrentHourlySlot(hourly);
  const precipChance = parseInt(hourly[slotIdx]?.chanceofrain ?? 0);

  const metrics = [
    { label: "💧 Влажность", val: `${current.humidity}%` },
    { label: "💨 Скорость ветра", val: `${current.windspeedKmph} км/ч` },
    { label: "🌧 Вероятность осадков", val: `${precipChance}%` },
    { label: "🌡 Ощущается как", val: formatTemp(parseFloat(current.FeelsLikeC)) },
    { label: "📉 Давление", val: `${current.pressure} гПа` },
  ];

  cards.forEach((card, i) => {
    if (!metrics[i]) { card.style.display = "none"; return; }
    card.querySelector(".card__label").textContent = metrics[i].label;
    card.querySelector(".card__context").textContent = metrics[i].val;
  });
}

function renderForecast(weather) {
  forecastGrid.innerHTML = "";
  weather.forEach((day) => {
    const date = new Date(day.date);
    const code = parseInt(day.hourly[4]?.weatherCode ?? day.hourly[0].weatherCode);
    const li = document.createElement("li");
    li.className = "six-days";
    li.innerHTML = `
      <time datetime="${day.date}" class="six-days__date">
        ${date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}
      </time>
      <span>${formatTemp(parseFloat(day.mintempC))} / ${formatTemp(parseFloat(day.maxtempC))} · ${getWeatherDescription(code)}</span>
    `;
    forecastGrid.appendChild(li);
  });
}

function renderHourlyForecast(weather) {
  document.querySelector(".hourly-card")?.remove();

  const currentHour = new Date().getHours();
  const slots = [];
  for (const day of weather) {
    for (const h of day.hourly) {
      slots.push({ ...h, date: day.date });
    }
  }

  let startIdx = 0;
  for (let i = 0; i < slots.length && i < 8; i++) {
    if (parseInt(slots[i].time) / 100 <= currentHour) startIdx = i;
    else break;
  }

  const next = slots.slice(startIdx, startIdx + 5);

  let hourlyHTML = `
    <div class="hourly-card">
      <h3 class="card__label">Погода в течение 12 часов</h3>
      <div class="hourly-scroll">
  `;

  for (const h of next) {
    const hour = String(parseInt(h.time) / 100).padStart(2, "0") + ":00";
    const precip = parseInt(h.chanceofrain ?? 0);
    hourlyHTML += `
      <div class="hourly-item">
        <span class="hourly-time">${hour}</span>
        <span class="hourly-icon">${getWeatherEmoji(parseInt(h.weatherCode))}</span>
        <span class="hourly-temper">${formatTemp(parseFloat(h.tempC))}</span>
        ${precip > 0 ? `<span class="hourly-precip">💧${precip}%</span>` : ""}
      </div>
    `;
  }
  hourlyHTML += `</div></div>`;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = hourlyHTML;
  document.querySelector(".container").insertBefore(
    wrapper.firstElementChild,
    document.querySelector(".card"),
  );
}

setupThemeToggle();
loadAllData();
