export const WTTR_URL = "https://wttr.in";

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
    113: "Ясно",
    116: "Переменная облачность",
    119: "Облачно",
    122: "Пасмурно",
    143: "Туман",
    176: "Местами дождь",
    179: "Местами снег",
    182: "Слякоть",
    185: "Ледяная морось",
    200: "Гроза",
    227: "Метель",
    230: "Пурга",
    248: "Туман",
    260: "Туман",
    263: "Лёгкая морось",
    266: "Морось",
    281: "Ледяная морось",
    284: "Сильная ледяная морось",
    293: "Небольшой дождь",
    296: "Дождь",
    299: "Умеренный дождь",
    302: "Сильный дождь",
    305: "Проливной дождь",
    308: "Очень сильный дождь",
    311: "Ледяной дождь",
    314: "Сильный ледяной дождь",
    317: "Слабая слякоть",
    320: "Умеренная слякоть",
    323: "Небольшой снег",
    326: "Снег",
    329: "Умеренный снег",
    332: "Сильный снег",
    335: "Снегопад",
    338: "Сильный снегопад",
    350: "Ледяной дождь",
    353: "Небольшой ливень",
    356: "Умеренный ливень",
    359: "Сильный ливень",
    362: "Снег с дождём",
    365: "Снег с дождём",
    368: "Небольшой снегопад",
    371: "Умеренный снегопад",
    374: "Ледяной дождь",
    377: "Ледяной дождь",
    386: "Гроза с дождём",
    389: "Гроза с ливнем",
    392: "Гроза со снегом",
    395: "Гроза с метелью",
  };
  return codes[code] || "Неизвестно";
}

export function getWeatherTheme(code) {
  if (code === 113) return "theme-sunny";
  if ([116, 119, 122, 143, 248, 260].includes(code)) return "theme-cloudy";
  if ([179, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371].includes(code))
    return "theme-snowy";
  return "theme-rainy";
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
    if (typeof onUnitChange === "function") onUnitChange(currentUnit);
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
