import { getAuthHeaders } from "./api.js";


const roomNameEl = document.getElementById("room-name");
const roomPriceEl = document.getElementById("room-price");
const checkInEl = document.getElementById("check-in");
const checkOutEl = document.getElementById("check-out");
const guestNameEl = document.getElementById("guest-name");
const guestPhoneEl = document.getElementById("guest-phone");
const totalPriceEl = document.getElementById("total-price");
const bookBtn = document.getElementById("book-btn");
const roomId = localStorage.getItem("selectedRoomId");
const roomPrice = parseFloat(localStorage.getItem("selectedRoomPrice") || 0);
const roomName = localStorage.getItem("selectedRoomName");


if (!roomId) {
  document.body.innerHTML = "<p>No room selected.</p>";
} else {
  roomNameEl.textContent = roomName;
  roomPriceEl.textContent = `$${roomPrice.toFixed(2)} per night`;
  totalPriceEl.textContent = `$0.00`;
}


function updateTotalPrice() {
  const checkIn = new Date(checkInEl.value);
  const checkOut = new Date(checkOutEl.value);

  if (checkIn && checkOut && checkOut > checkIn) {
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const total = nights * roomPrice;
    totalPriceEl.textContent = `$${total.toFixed(2)}`;
  } else {
    totalPriceEl.textContent = `$0.00`;
  }
}

checkInEl.addEventListener("change", updateTotalPrice);
checkOutEl.addEventListener("change", updateTotalPrice);

bookBtn.addEventListener("click", async () => {
  const guest_name = guestNameEl.value.trim();
  const guest_phone = guestPhoneEl.value.trim();
  const check_in = checkInEl.value;
  const check_out = checkOutEl.value;

  if (!guest_name || !guest_phone || !check_in || !check_out) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const headers = await getAuthHeaders();

    const res = await fetch("http://127.0.0.1:8000/api/bookings/", {
      method: "POST",
      headers,
      body: JSON.stringify({
        room_id: parseInt(roomId),
        guest_name,
        guest_phone,
        check_in,
        check_out
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.room || data.detail || "Booking failed");
    }

    alert("Booking successful!");
    window.location.href = "index.html";

  } catch (err) {
    alert("Booking failed: " + err.message);
    console.error(err);
  }
});
