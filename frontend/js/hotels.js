// import { getHotels } from "./api.js";

// const hotelsContainer = document.getElementById("hotels");
// const filterInput = document.getElementById("city-filter");
// const filterBtn = document.getElementById("filter-btn");
// const resetBtn = document.getElementById("reset-btn");

// let allHotels = [];

// async function renderHotels(filterCity = "") {
//   hotelsContainer.innerHTML = "";
//   const filtered = allHotels.filter(h => 
//     !filterCity || h.city.toLowerCase().includes(filterCity.toLowerCase())
//   );

//   filtered.forEach(hotel => {
//     const div = document.createElement("div");
//     div.className = "hotel-card";
//     div.innerHTML = `
//       <img src="${hotel.image_url || 'https://via.placeholder.com/250x150'}" alt="${hotel.name}">
//       <div class="info">
//         <h3>${hotel.name}</h3>
//         <p>${hotel.city}</p>
//         <p>${hotel.description.substring(0, 80)}...</p>
//       </div>
//       <button onclick="window.location.href='rooms.html?hotel_id=${hotel.id}'">View Rooms</button>
//     `;
//     hotelsContainer.appendChild(div);
//   });
// }

// filterBtn.addEventListener("click", () => renderHotels(filterInput.value));
// resetBtn.addEventListener("click", () => { filterInput.value = ""; renderHotels(); });

// (async () => {
//   allHotels = await getHotels();
//   renderHotels();
// })();

// js/hotels.js
import { API_BASE_URL } from "./config.js";

const hotelsContainer = document.getElementById("hotels");
const filterInput = document.getElementById("city-filter");
const filterBtn = document.getElementById("filter-btn");
const resetBtn = document.getElementById("reset-btn");

async function loadHotels(city = "") {
  hotelsContainer.innerHTML = "<p>Loading hotels...</p>";
  try {
    let url = `${API_BASE_URL}/hotels/`;
    if (city) {
      url += `?city=${encodeURIComponent(city)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch hotels");
    const hotels = await res.json();

    hotelsContainer.innerHTML = "";
    if (hotels.length === 0) {
      hotelsContainer.innerHTML = "<p>No hotels found.</p>";
      return;
    }

    hotels.forEach(hotel => {
      const div = document.createElement("div");
      div.className = "hotel-card";
      div.innerHTML = `
        <img src="${hotel.image_url || 'https://via.placeholder.com/250x150'}" alt="${hotel.name}">
        <div class="info">
          <h3>${hotel.name}</h3>
          <p><strong>City:</strong> ${hotel.city}</p>
          <p>${hotel.description ? hotel.description.substring(0, 80) + "..." : ""}</p>
        </div>
      `;

      const viewBtn = document.createElement("button");
      viewBtn.textContent = "View Rooms";
      viewBtn.addEventListener("click", () => {
        localStorage.setItem("selectedHotelId", hotel.id);
        localStorage.setItem("selectedHotelName", hotel.name);
        window.location.href = "rooms.html";
      });

      div.appendChild(viewBtn);
      hotelsContainer.appendChild(div);
    });
  } catch (err) {
    hotelsContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

filterBtn.addEventListener("click", () => loadHotels(filterInput.value.trim()));
resetBtn.addEventListener("click", () => {
  filterInput.value = "";
  loadHotels();
});

loadHotels();
