import { API_BASE_URL } from "./config.js";
import { getStoredAccessToken, getAuthHeaders } from "./api.js";

const bookingsContainer = document.getElementById("booking-list");

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
    localStorage.removeItem("refreshToken");
    loginLink.style.display = "inline";
    registerLink.style.display = "inline";
    accountLink.style.display = "none";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
  }
}

// --- Logout ---
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "index.html";
});

// --- Load user bookings ---
async function loadBookings() {
  if (!token) {
    bookingsContainer.innerHTML = "<p>Please login to see your bookings.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch bookings");

    const bookings = await res.json();

    // ფილტრი მხოლოდ booked სტატუსზე
    const activeBookings = bookings.filter(b => b.status === "booked");

    if (!activeBookings.length) {
      bookingsContainer.innerHTML = "<p>You have no active bookings.</p>";
      return;
    }

    bookingsContainer.innerHTML = activeBookings.map(b => `
      <div class="card">
        <h3>${b.hotel_name} - ${b.room_name}</h3>
        <p><strong>Check-in:</strong> ${b.check_in}</p>
        <p><strong>Check-out:</strong> ${b.check_out}</p>
        <p><strong>Total:</strong> $${b.total_price}</p>
        <button class="cancel-btn" data-id="${b.id}">Cancel</button>
        <button class="modify-btn" onclick="window.location.href='modify-booking.html?id=${b.id}'">
  Modify
</button>
      </div>
    `).join("");

  } catch (err) {
    bookingsContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

// --- Cancel booking ---
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("cancel-btn")) {
    const bookingId = e.target.dataset.id;
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel/`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Cancel failed");
      }
      await loadBookings();  // refresh after cancel
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
});

// --- Initialize page ---
loadUser();
loadBookings();
