import { API_BASE_URL } from "./config.js";
import { getStoredAccessToken, getAuthHeaders, logout } from "./api.js";

function initNavbar() {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const accountLink = document.getElementById("account-link");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfo = document.getElementById("user-info");

  async function loadUser() {
    const token = getStoredAccessToken();
    if (!token) return showLoggedOutUI();

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Unauthorized");
      const user = await res.json();

      userInfo.textContent = `Hi, ${user.username}`;
      loginLink.style.display = "none";
      registerLink.style.display = "none";
      accountLink.style.display = "inline";
      logoutBtn.style.display = "inline";
    } catch {
      localStorage.clear();
      showLoggedOutUI();
    }
  }

  function showLoggedOutUI() {
    loginLink.style.display = "inline";
    registerLink.style.display = "inline";
    accountLink.style.display = "none";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      window.location.href = "index.html";
    });
  }

  document.addEventListener("DOMContentLoaded", loadUser);
}

export { initNavbar };
