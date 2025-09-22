import { API_BASE_URL } from "./config.js";
import { getStoredAccessToken, getAuthHeaders } from "./api.js";

const roomsContainer = document.getElementById("rooms");
const filterForm = document.getElementById("filter-form"); // assume form wrapping your filters

const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const accountLink = document.getElementById("account-link");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

const token = getStoredAccessToken();

// --- Load current user info ---
async function loadUser() {
  if (!token) {
    loginLink.style.display = "inline";
    registerLink.style.display = "inline";
    accountLink.style.display = "none";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/me/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch user");
    const user = await res.json();
    userInfo.textContent = `Welcome, ${user.username}`;
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    accountLink.style.display = "inline";
    logoutBtn.style.display = "inline";
  } catch (err) {
    console.warn(err);
    localStorage.removeItem("accessToken");
    loginLink.style.display = "inline";
    registerLink.style.display = "inline";
    accountLink.style.display = "none";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
  }
}
loadUser();

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  window.location.reload();
});

// --- Load rooms with optional filters ---
async function loadRooms(filters = {}) {
  roomsContainer.innerHTML = "<p>Loading rooms...</p>";

  let url = new URL(`${API_BASE_URL}/rooms/`);
  Object.keys(filters).forEach(key => {
    if (filters[key]) url.searchParams.append(key, filters[key]);
  });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch rooms");
    const rooms = await res.json();
    if (!rooms.length) {
      roomsContainer.innerHTML = "<p>No rooms found.</p>";
      return;
    }

    roomsContainer.innerHTML = rooms.map(room => `
      <div class="card">
        <img src="${room.image_url || '/static/default.jpg'}" alt="${room.name}">
        <h3>${room.name}</h3>
        <p>Hotel: ${room.hotel_name}</p>
        <p>Price: $${room.price_per_night} per night</p>
        <button class="book-btn" data-roomid="${room.id}">Book</button>
      </div>
    `).join("");

  } catch (err) {
    roomsContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

// --- Filter submit ---
if (filterForm) {
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(filterForm);
    const filters = {};
    formData.forEach((value, key) => filters[key] = value.trim());
    loadRooms(filters);
  });
}

// --- Book button delegation ---
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("book-btn")) {
    const roomId = e.target.dataset.roomid;
    localStorage.setItem("selectedRoomId", roomId);

    if (!getStoredAccessToken()) {
      localStorage.setItem("redirectAfterLogin", `booked.html?room=${roomId}`);
      window.location.href = "login.html";
      return;
    }

    window.location.href = `booked.html?room=${roomId}`;
  }
});

// --- Initial load ---
loadRooms();
