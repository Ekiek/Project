const API_BASE = "http://127.0.0.1:8000/api";

async function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function getHotels() {
  const res = await fetch(`${API_BASE}/hotels/`);
  if (!res.ok) throw new Error("Failed to load hotels");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getRooms(hotelId) {
  const res = await fetch(`${API_BASE}/rooms/?hotel=${hotelId}`);
  if (!res.ok) throw new Error("Failed to load rooms");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}


export async function getBookings() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/bookings/`, { headers });
  if (!res.ok) throw new Error("Failed to load bookings");
  return res.json();
}

export async function bookRoom(roomId, guest_name, guest_phone, check_in, check_out) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/bookings/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ room_id: roomId, guest_name, guest_phone, check_in, check_out })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(data) || "Booking failed");
  }
  return res.json();
}

export async function cancelBooking(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/bookings/${id}/`, { method: "DELETE", headers });
  if (!res.ok) throw new Error("Cancel failed");
  return true;
}

export async function register(username, email, password) {
  const res = await fetch(`${API_BASE}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Registration failed");
  }
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || "Login failed");
  }

  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
