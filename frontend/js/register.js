import { API_BASE_URL } from "./config.js";

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_BASE_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    alert("Registration successful! Please login.");
    window.location.href = "login.html"; 
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
});
