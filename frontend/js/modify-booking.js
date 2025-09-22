// modify-booking.js
import { API_BASE_URL } from "./config.js";
import { getStoredAccessToken, getAuthHeaders } from "./api.js";

const form = document.getElementById("modify-form");
const roomSelect = document.getElementById("room");
const checkInInput = document.getElementById("check-in");
const checkOutInput = document.getElementById("check-out");
const message = document.getElementById("message");

const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const accountLink = document.getElementById("account-link");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const saveBtn = form.querySelector("button[type='submit']");
const token = getStoredAccessToken();

// --- Load current user info ---
async function loadUser() {
  if (!token) return;

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
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "index.html";
});

// --- Get booking ID from query params ---
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("id");
if (!bookingId) window.location.href = "account.html";

// --- Load booking info ---
async function loadBooking() {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch booking");
    const booking = await res.json();

    checkInInput.value = booking.check_in;
    checkOutInput.value = booking.check_out;

    // Load rooms for selection
    const roomsRes = await fetch(`${API_BASE_URL}/rooms/`);
    const rooms = await roomsRes.json();
    roomSelect.innerHTML = rooms.map(r => `
      <option value="${r.id}" ${r.id === booking.room ? "selected" : ""}>
        ${r.hotel_name} - ${r.name} ($${r.price_per_night}/night)
      </option>
    `).join("");

    checkAvailability(); // initial availability check

  } catch (err) {
    message.textContent = err.message;
  }
}

// --- Check room availability ---
async function checkAvailability() {
  const room = roomSelect.value;
  const check_in = checkInInput.value;
  const check_out = checkOutInput.value;

  if (!room || !check_in || !check_out) return;

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/check_availability/`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room, check_in, check_out, booking_id: bookingId }),
    });
    const data = await res.json();
    if (!data.available) {
      message.textContent = "Selected room is not available for these dates.";
      saveBtn.disabled = true;
    } else {
      message.textContent = "";
      saveBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    message.textContent = "Error checking availability";
    saveBtn.disabled = true;
  }
}

// --- Form submit handler ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";

  const data = {
    room: roomSelect.value,
    check_in: checkInInput.value,
    check_out: checkOutInput.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/`, {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json();
      const errMsg = Object.values(errData).flat().join(" ") || "Modify failed";
      throw new Error(errMsg);
    }

    alert("Booking successfully modified!");
    window.location.href = "account.html";

  } catch (err) {
    message.textContent = err.message;
  }
});

// --- Listen for changes to check availability ---
roomSelect.addEventListener("change", checkAvailability);
checkInInput.addEventListener("change", checkAvailability);
checkOutInput.addEventListener("change", checkAvailability);

// --- Initialize ---
loadUser();
loadBooking();
