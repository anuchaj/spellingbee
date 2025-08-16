// public/auth.js

// Save token + user to localStorage
function saveAuthData(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// Load user from localStorage
function getAuthUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Get token
function getToken() {
  return localStorage.getItem("token");
}

// Remove auth data (logout)
function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html"; // Redirect on logout
}

// Display user info (call this in nav/header)
function displayUserInfo() {
  const user = getAuthUser();
  if (!user) return;

  const userInfoEl = document.getElementById("user-info");
  if (userInfoEl) {
    userInfoEl.innerHTML = `
      Logged in as <strong>${user.name}</strong> (${user.account_type})
    `; //<button onclick="clearAuthData()">Logout</button>
  }
}

// Store token and role
function storeUserSession(token, account_type, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("account_type", account_type);
  localStorage.setItem("user", JSON.stringify(user));
}

// Check if logged in
function isLoggedIn() {
  return !!getToken();
}

// Check admin access
function isAdmin() {
  return localStorage.getItem("account_type") === "admin";
}

// Unified admin access check:
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  if (location.pathname.includes("admin.html") && (!token || user?.account_type !== "admin")) {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
  }
});


// Handle login
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      storeUserSession(data.token, data.user.account_type, data.user);
      alert("Login successful!");
      window.location.href = "index.html"; // or redirect to admin.html if admin
    } else {
      document.getElementById("login-error").innerText = data.message || "Login failed.";
    }
  } catch (err) {
    console.error(err);
  }
});

// Handle signup
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }) // account_type defaults to student
    });

    const data = await res.json();
    if (res.ok) {
      storeUserSession(data.token, data.user.account_type, data.user);
      alert("Signup successful!");
      window.location.href = "login.html";
    } else {
      document.getElementById("signup-error").innerText = data.message || "Signup failed.";
    }
  } catch (err) {
    console.error(err);
  }
});


// On myaccount.html page, load profile info
function loadProfileInfo() {
  const user = getAuthUser();

  const parts = user.name.trim().split(" ");
  const first = parts[0];
  const last = parts.slice(1).join(" ") || "";
  document.getElementById("first-name").innerText = first || "";
  document.getElementById("last-name").innerText = last || "";
  document.getElementById("user-email").innerText = user.email || "";
  document.getElementById("welcome-name").innerText = `Welcome, ${first || user.name}`;

  if (user.account_type === "admin") {
    document.getElementById("admin-link").style.display = "inline-block";
  } else {
    document.getElementById("admin-link").style.display = "none";
  }
} 

// Update name and password
document.getElementById("update-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("token");
  if (!token) return;

  const name = `${document.getElementById("new-firstname").value.trim()} ${document.getElementById("new-lastname").value.trim()}`;
  const password = document.getElementById("new-password").value;

  try {
    const res = await fetch("/api/auth/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById("update-msg").innerText = "Account updated successfully.";
    } else {
      document.getElementById("update-error").innerText = data.message || "Update failed.";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("update-error").innerText = "Error updating account.";
  }
});
