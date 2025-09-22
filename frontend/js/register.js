import { register, login } from "./api.js";

const form = document.getElementById("register-form");

form.addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await register(username, email, password);
    const data = await login(username, password);
    localStorage.setItem("username", username);
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    window.location.href = "index.html";
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
});
