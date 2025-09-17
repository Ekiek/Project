import { login } from "./api.js";

document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    await login(username, password);
    alert("Login successful!");
    location.href = "hotels.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});
