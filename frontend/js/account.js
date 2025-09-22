import { apiGet, apiPatch, apiDelete } from "./api.js";

const bookingList = document.getElementById("booking-list");

async function loadBookings() {
  bookingList.innerHTML = "Loading...";
  try {
    const bookings = await apiGet("http://127.0.0.1:8000/api/bookings/");
    bookingList.innerHTML = "";
    bookings.forEach(booking => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${booking.room_name} - ${booking.hotel_name}</h3>
        <p>${booking.check_in} to ${booking.check_out}</p>
        <p>Guest: ${booking.guest_name}</p>
        <p>Phone: ${booking.guest_phone}</p>
        <p>Total: $${booking.total_price}</p>
        <button class="cancel-btn" data-id="${booking.id}">Cancel</button>
      `;
      card.querySelector(".cancel-btn").addEventListener("click", async () => {
        if (confirm("Cancel this booking?")) {
          await apiDelete(`http://127.0.0.1:8000/api/bookings/${booking.id}/`);
          loadBookings();
        }
      });
      bookingList.appendChild(card);
    });
  } catch (err) {
    bookingList.innerHTML = "Failed to load bookings.";
    console.error(err);
  }
}

loadBookings();
