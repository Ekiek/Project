import { getHotels } from "./api.js";

const hotelsContainer = document.getElementById("hotels");
const filterInput = document.getElementById("city-filter");
const filterBtn = document.getElementById("filter-btn");
const resetBtn = document.getElementById("reset-btn");

let allHotels = [];

async function renderHotels(filterCity = "") {
  hotelsContainer.innerHTML = "";
  const filtered = allHotels.filter(h => 
    !filterCity || h.city.toLowerCase().includes(filterCity.toLowerCase())
  );

  filtered.forEach(hotel => {
    const div = document.createElement("div");
    div.className = "hotel-card";
    div.innerHTML = `
      <img src="${hotel.image_url || 'https://via.placeholder.com/250x150'}" alt="${hotel.name}">
      <div class="info">
        <h3>${hotel.name}</h3>
        <p>${hotel.city}</p>
        <p>${hotel.description.substring(0, 80)}...</p>
      </div>
      <button onclick="window.location.href='rooms.html?hotel_id=${hotel.id}'">View Rooms</button>
    `;
    hotelsContainer.appendChild(div);
  });
}

filterBtn.addEventListener("click", () => renderHotels(filterInput.value));
resetBtn.addEventListener("click", () => { filterInput.value = ""; renderHotels(); });

(async () => {
  allHotels = await getHotels();
  renderHotels();
})();
