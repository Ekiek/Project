import { API_BASE_URL } from "./config.js";

// --- Auth helpers ---
function getStoredAccessToken() {
    return localStorage.getItem("accessToken");
}

function getAuthHeaders(isJson = true) {
    const token = getStoredAccessToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (isJson) headers["Content-Type"] = "application/json";
    return headers;
}

// --- DOM Elements ---
const guestNameInput = document.getElementById("guest-name");
const guestPhoneInput = document.getElementById("guest-phone");
const checkInInput = document.getElementById("check-in");
const checkOutInput = document.getElementById("check-out");
const totalPriceSpan = document.getElementById("total-price");
const bookBtn = document.getElementById("book-btn");
const roomNameEl = document.getElementById("room-name");
const roomPriceEl = document.getElementById("room-price");

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || localStorage.getItem("selectedRoomId");

if (!roomId) {
    alert({ icon: "error", title: "No room selected" });
    window.location.href = "rooms.html";
}

if (!getStoredAccessToken()) {
    localStorage.setItem("redirectAfterLogin", `booked.html?room=${roomId}`);
    window.location.href = "login.html";
}

// --- Load room data ---
async function loadRoom() {
    try {
        const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/`);
        if (!res.ok) throw new Error("Failed to load room data");
        const room = await res.json();
        roomNameEl.textContent = room.name;
        roomPriceEl.textContent = room.price_per_night;
    } catch (err) {
        console.error(err);
        alert({ icon: "error", title: "Failed to load room data" });
    }
}

// --- Calculate total price ---
function updateTotalPrice() {
    const checkIn = new Date(checkInInput.value);
    const checkOut = new Date(checkOutInput.value);
    if (!checkIn || !checkOut || checkOut <= checkIn) {
        totalPriceSpan.textContent = "$0";
        return;
    }
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const price = parseFloat(roomPriceEl.textContent) || 0;
    totalPriceSpan.textContent = `$${(nights * price).toFixed(2)}`;
}

// --- Load bookings for calendar ---
async function getRoomBookings() {
    const res = await fetch(`${API_BASE_URL}/bookings/room_bookings/?room=${roomId}`);
    if (!res.ok) throw new Error("Failed to load room bookings");
    return await res.json();
}

// --- Initialize Flatpickr ---
async function initCalendars() {
    await loadRoom();
    const bookings = await getRoomBookings();
    const disabledRanges = bookings.map(b => ({ from: b.check_in, to: b.check_out }));

    const checkOutCal = flatpickr("#check-out", {
        dateFormat: "Y-m-d",
        minDate: "today",
        disable: disabledRanges,
        onDayCreate: styleDay
    });

    flatpickr("#check-in", {
        dateFormat: "Y-m-d",
        minDate: "today",
        disable: disabledRanges,
        onDayCreate: styleDay,
        onChange: function(selectedDates, dateStr) {
            checkOutCal.set("minDate", dateStr);
            updateTotalPrice(); // აქ ჩავსვათ ჯამური ფასის განახლება
        }
    });

    // განახლება check-out ცვლილებისას
    checkOutCal.config.onChange.push(function(selectedDates) {
        updateTotalPrice();
    });
}

// --- Style calendar days ---
function styleDay(dObj, dStr, fp, dayElem) {
    if (dayElem.classList.contains("flatpickr-disabled")) {
        dayElem.style.background = "#f44336"; // წითელი დაჯავშნილი
        dayElem.style.color = "white";
    } else {
        dayElem.style.background = "#4caf50"; // მწვანე თავისუფალი
        dayElem.style.color = "white";
    }
}

// --- Book button handler ---
bookBtn.addEventListener("click", async () => {
    const guest_name = guestNameInput.value.trim();
    const guest_phone = guestPhoneInput.value.trim();
    const check_in = checkInInput.value;
    const check_out = checkOutInput.value;

    if (!guest_name || !guest_phone || !check_in || !check_out) {
        alert({ icon: "warning", title: "Please fill all fields" });
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/bookings/`, {
            method: "POST",
            headers: getAuthHeaders(true),
            body: JSON.stringify({ 
                room: parseInt(roomId, 10), 
                guest_name, 
                guest_phone, 
                check_in, 
                check_out 
            })
        });

        const text = await res.text();
        if (!res.ok) {
            alert({ icon: "error", title: "Booking failed", text });
            return;
        }

        const data = JSON.parse(text);
        alert({ 
            icon: "success", 
            title: "Success!", 
            text: data.message || "Your room has been booked successfully!" 
        }).then(() => {
            window.location.href = "account.html";
        });

    } catch (err) {
        console.error("Fetch error:", err);
        alert("Your room has been booked successfully!");
    }
});

document.addEventListener("DOMContentLoaded", initCalendars);
