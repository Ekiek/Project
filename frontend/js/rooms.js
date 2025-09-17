import { getRooms } from "./api.js";

const roomsContainer = document.getElementById("rooms");


const urlParams = new URLSearchParams(window.location.search);
const hotelId = urlParams.get("hotel");

async function loadRooms() {
  if (!hotelId) {
    roomsContainer.innerHTML = "<p>No hotel selected.</p>";
    return;
  }

  try {
    const rooms = await getRooms(hotelId);
    if (!rooms.length) {
      roomsContainer.innerHTML = "<p>No rooms available for this hotel.</p>";
      return;
    }
    renderRooms(rooms);
  } catch (err) {
    roomsContainer.innerHTML = `<p>Error loading rooms: ${err.message}</p>`;
  }
}

function renderRooms(rooms) {
  roomsContainer.innerHTML = "";

  rooms.forEach(room => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${room.image_url || 'https://via.placeholder.com/400x180'}" alt="${room.name}">
      <div class="info">
        <h3>${room.name}</h3>
        <p>Type: ${room.room_type}</p>
        <p>Price: $${room.price_per_night}/night</p>
        <button class="book-btn">Book Now</button>
      </div>
    `;

    const bookBtn = div.querySelector(".book-btn");
    bookBtn.addEventListener("click", () => goToBooking(room));

    roomsContainer.appendChild(div);
  });
}

function goToBooking(room) {
  localStorage.setItem("selectedRoomId", room.id);
  localStorage.setItem("selectedRoomPrice", room.price_per_night);
  localStorage.setItem("selectedRoomName", room.name);

  window.location.href = "booked.html";
}

loadRooms();
