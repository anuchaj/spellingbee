// auth.js

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
  window.location.href = "/login.html"; // Redirect on logout
}

// Protect admin page
function protectAdminPage() {
  const user = getAuthUser();
  if (!user || user.account_type !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "/login.html";
  }
}

// Display user info (call this in nav/header)
function displayUserInfo() {
  const user = getAuthUser();
  if (!user) return;

  const userInfoEl = document.getElementById("user-info");
  if (userInfoEl) {
    userInfoEl.innerHTML = `
      Logged in as <strong>${user.name}</strong> (${user.account_type})
      <button onclick="clearAuthData()">Logout</button>
    `;
  }
}


// Store token and role
function storeUserSession(token, account_type) {
  localStorage.setItem("token", token);
  localStorage.setItem("account_type", account_type);
}

// Get token
function getToken() {
  return localStorage.getItem("token");
}

// Check if logged in
function isLoggedIn() {
  return !!getToken();
}

// Check admin access
function isAdmin() {
  return localStorage.getItem("account_type") === "admin";
}

// Protect admin page
if (window.location.pathname.includes("admin.html")) {
  if (!isLoggedIn()) {
    alert("You must log in to access this page.");
    window.location.href = "login.html";
  } else if (!isAdmin()) {
    alert("Access denied. Admins only.");
    window.location.href = "login.html";
  }
}

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
      storeUserSession(data.token, data.user.account_type);
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
      storeUserSession(data.token, data.user.account_type);
      alert("Signup successful!");
      window.location.href = "index.html";
    } else {
      document.getElementById("signup-error").innerText = data.message || "Signup failed.";
    }
  } catch (err) {
    console.error(err);
  }
});

