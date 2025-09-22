import { API_BASE_URL } from "./config.js";

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/token/`, { // უკანა urls: /api/token/
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || data.error || "Login failed");

    // Save tokens
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    localStorage.setItem("username", username);

    // redirect to previously requested page (if set), else index
    const redirect = localStorage.getItem("redirectAfterLogin") || "index.html";
    localStorage.removeItem("redirectAfterLogin");
    window.location.href = redirect;

  } catch (err) {
    console.error("login error:", err);
    alert(err.message || "Login failed");
  }
});

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/api-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  // DRF Token
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  return data;
}