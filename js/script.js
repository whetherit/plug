export const PROXY_BASE = ""; // вставь URL Railway после деплоя

export const GEO_URL = PROXY_BASE
  ? `${PROXY_BASE}/geo`
  : "https://geocoding-api.open-meteo.com/v1/search";
export const WEATHER_URL = PROXY_BASE
  ? `${PROXY_BASE}/weather`
  : "https://api.open-meteo.com/v1/forecast";
export let currentUnit = localStorage.getItem("weather_unit") || "C";
export const DEFAULT_CITIES = ["Москва", "Санкт-Петербург", "Лондон"];
export let currentTheme =
  localStorage.getItem("weather_theme") || getSystemTheme();

document.documentElement.setAttribute("data-theme", currentTheme);

export function getSavedCities() {
  return JSON.parse(localStorage.getItem("weather_saved")) || DEFAULT_CITIES;
}

export function saveCities(citiesArray) {
  localStorage.setItem("weather_saved", JSON.stringify(citiesArray));
}

export function getWeatherDescription(code) {
  const codes = {
    0: "Ясно",
    1: "Преимущественно ясно",
    2: "Переменная облачность",
    3: "Пасмурно",
    45: "Туман",
    48: "Иней",
    51: "Лёгкая морось",
    53: "Морось",
    55: "Сильная морось",
    61: "Небольшой дождь",
    63: "Дождь",
    65: "Сильный дождь",
    71: "Небольшой снег",
    73: "Снег",
    75: "Сильный снегопад",
    80: "Небольшой ливень",
    81: "Ливень",
    82: "Сильный ливень",
    95: "Гроза",
    96: "Гроза с градом",
    99: "Сильная гроза с градом",
  };
  return codes[code] || "Неизвестно";
}

export function getWeatherTheme(code) {
  if (code === 0 || code === 1) {
    return "theme-sunny";
  }
  if (code === 2 || code === 3 || (code >= 45 && code <= 48)) {
    return "theme-cloudy";
  }
  if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82) || code >= 95) {
    return "theme-rainy";
  }
  if (code >= 71 && code <= 75) {
    return "theme-snowy";
  }
  return "weather";
}

export function setupUnitToggle(onUnitChange) {
  const unitBtn = document.querySelector(".toggle-unit-btn");
  if (!unitBtn) return;

  unitBtn.textContent = currentUnit === "C" ? "Показать в °F" : "Показать в °C";
  unitBtn.addEventListener("click", () => {
    currentUnit = currentUnit === "C" ? "F" : "C";
    localStorage.setItem("weather_unit", currentUnit);
    unitBtn.textContent =
      currentUnit === "C" ? "Показать в °F" : "Показать в °C";
    if (typeof onUnitChange === "function") {
      onUnitChange(currentUnit);
    }
  });
}

export function setupThemeToggle() {
  const themeBtn = document.querySelector(".toggle-theme-btn");
  if (!themeBtn) return;

  themeBtn.textContent = currentTheme === "light" ? "🌙" : "☀️";
  themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("weather_theme", currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
    themeBtn.textContent = currentTheme === "light" ? "🌙" : "☀️";
  });
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
