// import { getHotels, logout } from "./api.js";

// const hotelsContainer = document.getElementById("hotels");
// const userInfoEl = document.getElementById("user-info");
// const loginLink = document.getElementById("login-link");
// const registerLink = document.getElementById("register-link");
// const accountLink = document.getElementById("account-link");
// const logoutBtn = document.getElementById("logout-btn");

// // --- Navbar
// function updateNavbar() {
//   const username = localStorage.getItem("username");
//   if (username) {
//     userInfoEl.textContent = `Welcome, ${username}`;
//     loginLink.style.display = "none";
//     registerLink.style.display = "none";
//     accountLink.style.display = "inline-block";
//     logoutBtn.style.display = "inline-block";
//   } else {
//     userInfoEl.textContent = "";
//     loginLink.style.display = "inline-block";
//     registerLink.style.display = "inline-block";
//     accountLink.style.display = "none";
//     logoutBtn.style.display = "none";
//   }
// }

// logoutBtn.addEventListener("click", () => {
//   logout();
//   updateNavbar();
//   window.location.href = "index.html";
// });

// updateNavbar();

// // --- Load Hotels (index.html)
// async function loadHotels() {
//   if (!hotelsContainer) return;
//   try {
//     const hotels = await getHotels();
//     hotelsContainer.innerHTML = "";
//     hotels.forEach(hotel => {
//       const card = document.createElement("div");
//       card.className = "card";
//       card.innerHTML = `
//         <img src="${hotel.image_url || 'default.jpg'}" alt="${hotel.name}">
//         <h3>${hotel.name}</h3>
//         <p>${hotel.city}</p>
//         <p>${hotel.description || ''}</p>
//         <button data-id="${hotel.id}" data-name="${hotel.name}">View Rooms</button>
//       `;
//       hotelsContainer.appendChild(card);

//       card.querySelector("button").addEventListener("click", () => {
//         localStorage.setItem("selectedHotelId", hotel.id);
//         localStorage.setItem("selectedHotelName", hotel.name);
//         window.location.href = "rooms.html";
//       });
//     });
//   } catch (err) {
//     hotelsContainer.innerHTML = "<p>Failed to load hotels.</p>";
//     console.error(err);
//   }
// }

// loadHotels();

import { getHotels, logout } from "./api.js";

const hotelsContainer = document.getElementById("hotels");
const userInfoEl = document.getElementById("user-info");
const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const accountLink = document.getElementById("account-link");
const logoutBtn = document.getElementById("logout-btn");

// Navbar update
function updateNavbar() {
  const username = localStorage.getItem("username");
  if (username) {
    userInfoEl.textContent = `Welcome, ${username}`;
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    accountLink.style.display = "inline-block";
    logoutBtn.style.display = "inline-block";
  } else {
    userInfoEl.textContent = "";
    loginLink.style.display = "inline-block";
    registerLink.style.display = "inline-block";
    accountLink.style.display = "none";
    logoutBtn.style.display = "none";
  }
}

logoutBtn.addEventListener("click", () => {
  logout();
  updateNavbar();
  window.location.href = "index.html";
});

updateNavbar();

// Load Hotels
async function loadHotels() {
  if (!hotelsContainer) return;
  try {
    const hotels = await getHotels();
    hotelsContainer.innerHTML = "";
    hotels.forEach(hotel => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${hotel.image_url || 'default.jpg'}" alt="${hotel.name}">
        <h3>${hotel.name}</h3>
        <p>${hotel.city}</p>
        <p>${hotel.description || ''}</p>
        <button data-id="${hotel.id}" data-name="${hotel.name}">View Rooms</button>
      `;
      hotelsContainer.appendChild(card);
      card.querySelector("button").addEventListener("click", () => {
        localStorage.setItem("selectedHotelId", hotel.id);
        localStorage.setItem("selectedHotelName", hotel.name);
        window.location.href = "rooms.html";
      });
    });
  } catch (err) {
    hotelsContainer.innerHTML = "<p>Failed to load hotels.</p>";
    console.error(err);
  }
}

loadHotels();
