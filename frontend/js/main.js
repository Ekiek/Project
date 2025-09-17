import { getHotels } from "./api.js";

const hotelsContainer = document.getElementById("hotels");
const cityFilter = document.getElementById("city-filter");
const filterBtn = document.getElementById("filter-btn");
const resetBtn = document.getElementById("reset-btn");

let allHotels = [];

async function loadHotels() {
  try {
    allHotels = await getHotels();
    renderHotels(allHotels);
  } catch (err) {
    hotelsContainer.innerHTML = `<p>Error loading hotels: ${err.message}</p>`;
  }
}

function renderHotels(hotels) {
  hotelsContainer.innerHTML = "";
  hotels.forEach(hotel => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${hotel.image_url || 'https://via.placeholder.com/400x180'}" alt="${hotel.name}">
      <div class="info">
        <h3>${hotel.name}</h3>
        <p>${hotel.city}</p>
        <button onclick="window.location.href='rooms.html?hotel=${hotel.id}'">View Rooms</button>
      </div>
    `;
    hotelsContainer.appendChild(div);
  });
}

filterBtn.addEventListener("click", () => {
  const city = cityFilter.value.trim().toLowerCase();
  const filtered = allHotels.filter(h => h.city.toLowerCase().includes(city));
  renderHotels(filtered);
});

resetBtn.addEventListener("click", () => {
  cityFilter.value = "";
  renderHotels(allHotels);
});

loadHotels();
