import { register } from "./api.js";

document.getElementById("register-form").addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await register(username, email, password);
    alert("Registration successful! You can login now.");
    location.href = "login.html";
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
});
