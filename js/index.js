import {
  WTTR_URL,
  GEO_URL,
  REVERSE_GEO_URL,
  getWeatherDescription,
  setupUnitToggle,
  getSavedCities,
  saveCities,
  setupThemeToggle,
  getWeatherTheme,
} from "./script.js";

const form = document.querySelector(".form");
const input = document.querySelector("#city-input");
const submitBtn = document.querySelector("#submit");
const grid = document.querySelector(".weather-card-grid");
let savedCities = getSavedCities();
let currentUnit = localStorage.getItem("weather_unit") || "C";

submitBtn.disabled = true;
input.addEventListener("input", () => {
  submitBtn.disabled = input.value.trim() === "";
});

async function getCityWeather(cityName) {
  // Геокодинг через Open-Meteo — получаем русское название и координаты
  const geoRes = await fetch(
    `${GEO_URL}?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`,
  );
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Город "${cityName}" не найден`);
  }

  const { latitude, longitude, name } = geoData.results[0];

  // Погода через wttr.in по координатам
  const wttrRes = await fetch(`${WTTR_URL}/${latitude},${longitude}?format=j1`);
  if (!wttrRes.ok) throw new Error(`Ошибка загрузки погоды для "${cityName}"`);
  const wttrData = await wttrRes.json();
  const current = wttrData.current_condition[0];

  return {
    name,
    temp: parseFloat(current.temp_C),
    code: parseInt(current.weatherCode),
    lat: latitude,
    lon: longitude,
  };
}

function renderCard(data) {
  const link = document.createElement("a");
  link.href = `weather.html?city=${encodeURIComponent(data.name)}&lat=${data.lat}&lon=${data.lon}`;
  link.className = "weather-card__link";

  let displayTemp = Math.round(data.temp);
  if (currentUnit === "F") displayTemp = Math.round(data.temp * 1.8 + 32);

  const card = document.createElement("article");
  card.className = `weather-card ${getWeatherTheme(data.code)}`;
  card.innerHTML = `
    <h2 class="weather-card__title">${data.name}</h2>
    <p class="weather-card__temper">${displayTemp}°${currentUnit}</p>
    <p class="no-select">${getWeatherDescription(data.code)}</p>
  `;

  link.appendChild(card);
  grid.prepend(link);
}

async function CurrentLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(
          `${REVERSE_GEO_URL}?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`,
        );
        const data = await res.json();
        const address = data.address || {};
        const cityName =
          address.city || address.town || address.village || address.state || "Моё местоположение";

        if (!savedCities.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
          savedCities.unshift(cityName);
          saveCities(savedCities);
          const weatherData = await getCityWeather(cityName);
          renderCard(weatherData);
        }
      } catch (err) {
        console.warn("Не удалось определить город по координатам:", err);
      }
    },
    (error) => console.log("Доступ к геолокации запрещён:", error.message),
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 },
  );
}

async function initGrid() {
  grid.innerHTML = "";
  await CurrentLocation();

  const weatherPromises = savedCities.map(async (city) => {
    try {
      return await getCityWeather(city);
    } catch (err) {
      console.warn(`Пропуск города ${city}:`, err.message);
      return null;
    }
  });

  const results = await Promise.all(weatherPromises);
  results.reverse().forEach((data) => {
    if (data) renderCard(data);
  });
}

let isSearching = false;
form.addEventListener("submit", async (e) => {
  if (isSearching) return;
  e.preventDefault();
  const city = input.value.trim();

  if (!city) return;
  if (savedCities.some((c) => c.toLowerCase() === city.toLowerCase())) {
    alert("Этот город уже в списке!");
    return;
  }

  try {
    isSearching = true;
    const data = await getCityWeather(city);
    savedCities.unshift(data.name);
    saveCities(savedCities);
    renderCard(data);
    input.value = "";
  } catch (err) {
    alert(err.message);
  } finally {
    isSearching = false;
  }
});

setupUnitToggle((newUnit) => {
  currentUnit = newUnit;
  initGrid();
});

setupThemeToggle();

window.addEventListener("pageshow", () => {
  savedCities = getSavedCities();
  initGrid();
});
