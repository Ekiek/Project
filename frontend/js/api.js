import { API_BASE_URL } from "./config.js";

// --- Authorization Header
function getAuthHeader() {
  const token = localStorage.getItem("accessToken");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

// --- Hotels
export async function getHotels(city = "") {
  let url = `${API_BASE_URL}/hotels/`;
  if (city) url += `?city=${encodeURIComponent(city)}`;

  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch hotels");
  return await res.json();
}

export async function getRooms(hotelId) {
  let url = `${API_BASE_URL}/rooms/`;
  if (hotelId) url += `?hotel=${hotelId}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" } // არ მოითხოვს Authorization
  });

  if (!res.ok) throw new Error("Failed to fetch rooms");
  return await res.json();
}

// --- Register
export async function register(username, email, password) {
  const res = await fetch(`${API_BASE_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  if (!res.ok) throw new Error("Registration failed");
  return await res.json();
}

// --- Login (JWT)
export async function login(username, password) {
  const res = await fetch(`${API_BASE_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error("Login failed");
  return await res.json();
}

// --- Logout
export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
}

// --- Book Room
export async function bookRoom(room, guest_name, guest_phone, check_in, check_out) {
  const res = await fetch(`${API_BASE_URL}/bookings/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ room, guest_name, guest_phone, check_in, check_out })
  });
  if (!res.ok) throw new Error("Booking failed");
  return await res.json();
}

// --- Get User Bookings
export async function getUserBookings() {
  const res = await fetch(`${API_BASE_URL}/bookings/`, { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return await res.json();
}

// --- Cancel Booking
export async function cancelBooking(id) {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel/`, {
    method: "POST",
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Cancel failed");
  return await res.json();
}

// --- Update Booking (optional)
export async function updateBooking(id, data) {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Update failed");
  return await res.json();
}
export function getStoredAccessToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

export function getAuthHeaders(includeJson = true) {
  const headers = {};
  const token = getStoredAccessToken();
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) {
    try {
      if (token.split(".").length === 3) {
        headers["Authorization"] = `Bearer ${token}`; // JWT
      } else {
        headers["Authorization"] = `Token ${token}`; // DRF Token
      }
    } catch {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  // debug log (დაკომენტარე როცა მზად იქნება)
  // console.log("fetch", url, opts, "->", res.status);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.detail || (data?.error || `HTTP ${res.status}`));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

