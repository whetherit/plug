import {
  GEO_URL,
  WEATHER_URL,
  PROXY_BASE,
  getWeatherDescription,
  setupUnitToggle,
  getSavedCities,
  saveCities,
  setupThemeToggle,
  getWeatherTheme,
} from "./script.js";
const REVERSE_GEO_URL = PROXY_BASE
  ? `${PROXY_BASE}/reverse`
  : "https://nominatim.openstreetmap.org/reverse";
const form = document.querySelector(".form");
const input = document.querySelector("#city-input");
const grid = document.querySelector(".weather-card-grid");
let savedCities = getSavedCities();
let currentUnit = localStorage.getItem("weather_unit") || "C";

async function getCityWeather(cityName) {
  const geoRes = await fetch(
    `${GEO_URL}?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`,
  );
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Город "${cityName}" не найден`);
  }

  const { latitude, longitude, name } = geoData.results[0];

  const weatherRes = await fetch(
    `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weather_code` +
      `&timezone=auto`,
  );
  const weatherData = await weatherRes.json();

  return {
    name: name,
    temp: weatherData.current.temperature_2m,
    code: weatherData.current.weather_code,
    lat: latitude,
    lon: longitude,
  };
}

function renderCard(data) {
  const link = document.createElement("a");
  link.href = `weather.html?city=${encodeURIComponent(data.name)}&lat=${data.lat}&lon=${data.lon}`;
  link.className = "weather-card__link";

  let displayTemp = Math.round(data.temp);
  if (currentUnit === "F") {
    displayTemp = Math.round(data.temp * 1.8 + 32);
  }

  const card = document.createElement("article");
  card.className = "weather-card";

  const cardTheme = getWeatherTheme(data.code);
  card.classList.add(cardTheme);

  card.innerHTML = `
    <h2 class="weather-card__title">${data.name}</h2>
    <p class="weather-card__temper">${displayTemp}°${currentUnit}</p>
    <p class="no-select">${getWeatherDescription(data.code)}</p>
  `;

  link.appendChild(card);
  grid.prepend(link);
}

async function CurrentLocation() {
  if (!navigator.geolocation) {
    console.log("Геолокация не поддерживается браузером");
    return;
  }
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
          address.city ||
          address.town ||
          address.village ||
          address.state ||
          "Моё местоположение";

        if (
          !savedCities.some((c) => c.toLowerCase() === cityName.toLowerCase())
        ) {
          savedCities.unshift(cityName);
          saveCities(savedCities);

          const weatherData = await getCityWeather(cityName);
          renderCard(weatherData);
          console.log(`Добавлен город по геолокации: ${cityName}`);
        }
      } catch (err) {
        console.warn("Не удалось определить город по координатам:", err);
      }
    },
    (error) => {
      console.log(
        "Доступ к геолокации запрещен или недоступен:",
        error.message,
      );
    },
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

  if (
    !city ||
    savedCities.some((c) => c.toLowerCase() === city.toLowerCase())
  ) {
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
