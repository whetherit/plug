import {
  WTTR_URL,
  getWeatherDescription,
  setupUnitToggle,
  getSavedCities,
  saveCities,
  setupThemeToggle,
  getWeatherTheme,
} from "./script.js";

const form = document.querySelector(".form");
const input = document.querySelector("#city-input");
const grid = document.querySelector(".weather-card-grid");
let savedCities = getSavedCities();
let currentUnit = localStorage.getItem("weather_unit") || "C";

async function getCityWeather(cityName) {
  const res = await fetch(
    `${WTTR_URL}/${encodeURIComponent(cityName)}?format=j1`,
  );
  if (!res.ok) throw new Error(`Город "${cityName}" не найден`);

  const data = await res.json();
  const area = data.nearest_area[0];
  const current = data.current_condition[0];

  return {
    name: cityName,
    temp: parseFloat(current.temp_C),
    code: parseInt(current.weatherCode),
    lat: parseFloat(area.latitude),
    lon: parseFloat(area.longitude),
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
        const res = await fetch(`${WTTR_URL}/${latitude},${longitude}?format=j1`);
        if (!res.ok) return;
        const data = await res.json();
        const cityName = data.nearest_area[0].areaName[0].value;

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

  if (!city || savedCities.some((c) => c.toLowerCase() === city.toLowerCase())) {
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
