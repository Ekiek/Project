// booked.js
import { API_BASE_URL } from "./config.js";

// --- Helper Functions ---
function getStoredAccessToken() {
  return localStorage.getItem("accessToken");
}

function getAuthHeaders(isJson = true) {
  const token = getStoredAccessToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

// --- DOM Elements ---
const guestNameInput = document.getElementById("guest-name");
const guestPhoneInput = document.getElementById("guest-phone");
const checkInInput = document.getElementById("check-in");
const checkOutInput = document.getElementById("check-out");
const totalPriceSpan = document.getElementById("total-price");
const bookBtn = document.getElementById("book-btn");
const roomNameEl = document.getElementById("room-name");
const roomPriceEl = document.getElementById("room-price");

// --- Get roomId from query param or localStorage ---
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || localStorage.getItem("selectedRoomId");

if (!roomId) {
  alert("No room selected");
  window.location.href = "rooms.html";
}

// --- Redirect if not logged in ---
if (!getStoredAccessToken()) {
  localStorage.setItem("redirectAfterLogin", `booked.html?room=${roomId}`);
  window.location.href = "login.html";
}

// --- Load Room Details ---
async function loadRoom() {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/`);
    if (!res.ok) throw new Error("Failed to load room data");
    const room = await res.json();
    roomNameEl.textContent = room.name;
    roomPriceEl.textContent = room.price_per_night;
  } catch (err) {
    console.error(err);
    alert("Failed to load room data");
  }
}
loadRoom();

// --- Update Total Price ---
function updateTotalPrice() {
  const checkIn = new Date(checkInInput.value);
  const checkOut = new Date(checkOutInput.value);
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    totalPriceSpan.textContent = "$0";
    return;
  }
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const price = parseFloat(roomPriceEl.textContent) || 0;
  totalPriceSpan.textContent = `$${(nights * price).toFixed(2)}`;
}
checkInInput.addEventListener("change", updateTotalPrice);
checkOutInput.addEventListener("change", updateTotalPrice);

// --- Booking ---
bookBtn.addEventListener("click", async () => {
  const guest_name = guestNameInput.value.trim();
  const guest_phone = guestPhoneInput.value.trim();
  const check_in = checkInInput.value;
  const check_out = checkOutInput.value;

  if (!guest_name || !guest_phone || !check_in || !check_out) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        room: parseInt(roomId, 10),
        guest_name,
        guest_phone,
        check_in,
        check_out
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      if (res.status === 401) {
        alert("Please login first");
        localStorage.setItem("redirectAfterLogin", `booked.html?room=${roomId}`);
        window.location.href = "login.html";
        return;
      }
      throw new Error(errorData?.room || errorData?.detail || "Booking failed");
    }

    const data = await res.json();
    alert(data.message || "Booked successfully!");
    window.location.href = "account.html";

  } catch (err) {
    console.error("Booking error:", err);
    alert(err.message || "Booking failed");
  }
});
