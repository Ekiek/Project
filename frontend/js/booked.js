// js/booked.js
import { API_BASE_URL } from "./config.js";
import { getStoredAccessToken, getAuthHeaders, fetchJSON } from "./api.js";

const guestNameInput = document.getElementById("guest-name");
const guestPhoneInput = document.getElementById("guest-phone");
const checkInInput = document.getElementById("check-in");
const checkOutInput = document.getElementById("check-out");
const totalPriceSpan = document.getElementById("total-price");
const bookBtn = document.getElementById("book-btn");
const roomNameEl = document.getElementById("room-name");
const roomPriceEl = document.getElementById("room-price");

const token = getStoredAccessToken();

// get room id from query param or localStorage
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || localStorage.getItem("selectedRoomId");

if (!roomId) {
  alert("No room selected");
  window.location.href = "rooms.html";
}

// If not logged in -> redirect to login (and set redirectAfterLogin)
if (!token) {
  localStorage.setItem("redirectAfterLogin", `booked.html?room=${roomId}`);
  window.location.href = "login.html";
}

// load room detail (optional)
async function loadRoom() {
  try {
    const room = await fetchJSON(`${API_BASE_URL}/rooms/${roomId}/`);
    roomNameEl.textContent = room.name;
    roomPriceEl.textContent = `$${room.price_per_night}`;
  } catch (err) {
    console.error("Failed to load room", err);
    alert("Failed to load room data");
  }
}
loadRoom();

function updateTotalPrice() {
  const checkIn = new Date(checkInInput.value);
  const checkOut = new Date(checkOutInput.value);
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    totalPriceSpan.textContent = "$0";
    return;
  }
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const price = parseFloat(roomPriceEl.textContent.replace("$", "")) || 0;
  totalPriceSpan.textContent = `$${(nights * price).toFixed(2)}`;
}
checkInInput.addEventListener("change", updateTotalPrice);
checkOutInput.addEventListener("change", updateTotalPrice);

bookBtn.addEventListener("click", async () => {
  const guest_name = guestNameInput.value.trim();
  const guest_phone = guestPhoneInput.value.trim();
  const check_in = checkInInput.value;
  const check_out = checkOutInput.value;

  if (!guest_name || !guest_phone || !check_in || !check_out) {
    alert("Please fill all fields");
    return;
  }

  // debug print token + header
  console.log("Booking token:", token);
  console.log("Booking headers:", getAuthHeaders());

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

    if (res.status === 401) {
      // not authenticated — redirect to login
      alert("Please login first");
      localStorage.setItem("redirectAfterLogin", `booked.html?room=${roomId}`);
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();
    alert(data.message || "Booked!");
    window.location.href = "account.html";
  } catch (err) {
    console.error("Book error:", err);
    alert(err.message || "Booking failed");
  }
});
