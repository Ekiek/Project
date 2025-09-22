import { API_BASE_URL } from "./config.js";
import { getStoredAccessToken, getAuthHeaders } from "./api.js";

const roomsContainer = document.getElementById("rooms");

const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const accountLink = document.getElementById("account-link");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

const token = localStorage.getItem("token");

// --- Load user info ---
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
    const res = await fetch(`${API_BASE_URL}/users/me/`, { headers: getAuthHeaders(false) });
    if (!res.ok) throw new Error("no user");
    const user = await res.json();
    userInfo.textContent = `Welcome, ${user.username}`;
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    accountLink.style.display = "inline";
    logoutBtn.style.display = "inline";
  } catch (err) {
    console.warn("user fetch failed", err);
    // თუ token არასწორია, წავშალე და ვაჩვენოთ ლინკები
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
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

// load rooms (viewable without login; RoomViewSet.AllowAny)
async function loadRooms() {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/`);
    const rooms = await res.json();
    roomsContainer.innerHTML = rooms.map(room => `
      <div class="card">
        <img src="${room.image_url || '/static/default.jpg'}" alt="${room.name}">
        <h3>${room.name}</h3>
        <p>Hotel: ${room.hotel.name || room.hotel_name}</p>
        <p>Price: $${room.price_per_night} per night</p>
        <button class="book-btn" data-roomid="${room.id}">Book</button>
      </div>
    `).join("");
  } catch (err) {
    roomsContainer.innerHTML = "<p>Failed to load rooms.</p>";
    console.error(err);
  }
}
loadRooms();

// Book button handler (delegation)
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("book-btn")) {
    const roomId = e.target.dataset.roomid;
    // Save selectedRoom minimally
    localStorage.setItem("selectedRoomId", roomId);
    // if not logged in -> save redirect and go to login
    if (!getStoredAccessToken()) {
      localStorage.setItem("redirectAfterLogin", `booked.html?room=${roomId}`);
      window.location.href = "login.html";
      return;
    }
    // else go to booked page with query param
    window.location.href = `booked.html?room=${roomId}`;
  }
});