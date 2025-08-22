// Switch Sections
function showForm() {
  hideAll();
  const el = document.getElementById("reportSection");
  if (el) el.classList.remove("hidden");
}
function showMap() {
  hideAll();
  const el = document.getElementById("mapSection");
  if (el) el.classList.remove("hidden");
  if (typeof initMap === "function") initMap();
}
function showLeaderboard() {
  hideAll();
  const el = document.getElementById("leaderboardSection");
  if (el) el.classList.remove("hidden");
}
function hideAll() {
  const ids = [
    "reportSection", "mapSection", "leaderboardSection",
    "quizSection", "dashboardSection"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const loginBox = document.querySelector('.login-box');
  if (loginBox) loginBox.classList.add("hidden");
}

// Store reports in memory
let reports = [];
// Track EcoPoints
let scores = {};
let previousOrder = [];
const BADGE_LEVELS = [
  { min: 100, label: "🥇 Gold" },
  { min: 50,  label: "🥈 Silver" },
  { min: 25,  label: "🥉 Bronze" },
];

function getBadgeFor(points) {
  for (const b of BADGE_LEVELS) {
    if (points >= b.min) return b.label;
  }
  return "";
}
function submitReport(event) {
  event.preventDefault();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;
  const location = document.getElementById("location").value;
  const reporter = document.getElementById("reporterName").value;
  let lat = 22.57 + (Math.random() - 0.5) * 0.2;
  let lng = 88.36 + (Math.random() - 0.5) * 0.2;

  let report = { reporter, category, description, location, lat, lng, status: "new" };
  reports.push(report);
  // Add marker logic here if using map
  // Update leaderboard
  addPoints(reporter, 10);
  updateLeaderboard();
  alert("Report submitted!");
}

function categoryEmoji(catRaw) {
  const cat = catRaw.toLowerCase();
  if (cat.includes("plastic")) return "🧃";
  if (cat.includes("pollution")) return "💨";
  if (cat.includes("tree")) return "🌳";
  if (cat.includes("waste")) return "🗑️";
  return "🌱";
}
function makeDivIcon(emoji, status) {
  return L.divIcon({
    className: `marker ${status}`,
    html: `<span>${emoji}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34]
  });
}
// Initialize map
let map = null;

window.addEventListener("resize", () => {
  if (map) map.invalidateSize();
});

function initMap() {
  if (map) return;
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;
  map = L.map("map").setView([22.57, 88.36], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

function getMarkerIcon(status) {
  if (status === "new") return "red";
  if (status === "verified") return "orange";
  if (status === "resolved") return "green";
  return "gray";
}

function updateStatus(index, newStatus) {
  if (reports[index]) {
    reports[index].status = newStatus;
    updateLeaderboard();
  }
}

function statusLabel(status) {
  if (status === "new") return "New";
  if (status === "verified") return "Verified";
  if (status === "resolved") return "Resolved";
  return "";
}

function addPoints(name, points) {
  if (!scores[name]) scores[name] = 0;
  scores[name] += points;
}

function updateLeaderboard() {
  let table = document.getElementById("leaderboardTable");
  if (!table) return;
  let sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  table.innerHTML = "";
  sorted.forEach(([name, pts], idx) => {
    table.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${name} ${getBadgeFor(pts)}</td>
        <td>${pts}</td>
      </tr>
    `;
  });
}

function showQuiz() {
  hideAll();
  const quizSection = document.getElementById("quizSection");
  if (quizSection) quizSection.classList.remove("hidden");
}

const quizQuestions = [
  {
    q: "Which gas is the biggest contributor to global warming?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
    answer: 1
  },
  {
    q: "Which of these is NOT recyclable?",
    options: ["Plastic bottles", "Glass jars", "Styrofoam", "Aluminium cans"],
    answer: 2
  },
  {
    q: "Planting trees helps mainly by?",
    options: ["Producing plastic", "Absorbing CO2", "Generating heat", "Creating waste"],
    answer: 1
  }
];

let currentQ = 0;
let quizScore = 0;

function startQuiz() {
  currentQ = 0;
  quizScore = 0;
  renderQuestion();
}

function renderQuestion() {
  const container = document.getElementById("quizContainer");
  if (!container) return;
  const q = quizQuestions[currentQ];
  container.innerHTML = `
    <div class="font-semibold">${q.q}</div>
    ${q.options.map((opt, i) => `
      <button onclick="submitAnswer(${i})" class="bg-emerald-500 text-white px-4 py-2 rounded">${opt}</button>
    `).join("<br>")}
  `;
}

function submitAnswer(selected) {
  const q = quizQuestions[currentQ];
  if (selected === q.answer) quizScore++;
  nextQuestion();
}

function nextQuestion() {
  currentQ++;
  if (currentQ < quizQuestions.length) {
    renderQuestion();
  } else {
    const container = document.getElementById("quizContainer");
    if (container) container.innerHTML = `<div class="font-bold">Quiz Complete! Score: ${quizScore}/${quizQuestions.length}</div>`;
  }
}

function showDashboard() {
  hideAll();
  const dashboardSection = document.getElementById("dashboardSection");
  if (dashboardSection) dashboardSection.classList.remove("hidden");
  renderImpactChart();
}

// LOGIN LOGIC 
const loginForm = document.querySelector('.login-box form');
if (loginForm) {
  const loginUsername = loginForm.querySelector('input[type="text"]');
  const loginPassword = loginForm.querySelector('input[type="password"]');
  const loginButton = loginForm.querySelector('a.button');

  if (loginButton) {
    loginButton.addEventListener('click', function(e) {
      e.preventDefault();
      const username = loginUsername.value.trim();
      const password = loginPassword.value.trim();
      const users = getUsers();

      if (!username || !password) {
        alert("Please enter both username and password.");
        return;
      }

      if ((users[username] && users[username] === password) || (username === "admin" && password === "admin")) {
        alert(`Welcome, ${username}!`);
        document.querySelector('.login-box').classList.add('hidden');
        const signupBox = document.querySelector('.signup-box');
        if (signupBox) signupBox.classList.add('hidden');
        showDashboard();
        const reporterName = document.getElementById("reporterName");
        if (reporterName) reporterName.value = username;
      } else {
        alert("Invalid credentials.");
      }
    });
  }
}

// SIGNUP LOGIC
const signupBox = document.querySelector('.signup-box');
if (signupBox) {
  const signupForm = signupBox.querySelector('form');
  const signupUsername = signupForm.querySelector('input[type="text"]');
  const signupPassword = signupForm.querySelector('input[type="password"]');
  const signupButton = signupForm.querySelector('a.button');

  if (signupButton) {
    signupButton.addEventListener('click', function(e) {
      e.preventDefault();
      const username = signupUsername.value.trim();
      const password = signupPassword.value.trim();

      if (!username || !password) {
        alert("Please enter username and password.");
        return;
      }

      const users = getUsers();
      if (users[username]) {
        alert("Username already exists. Choose another.");
        return;
      }

      users[username] = password;
      saveUsers(users);
      alert("Account created! You can now login.");
      signupUsername.value = '';
      signupPassword.value = '';
      signupBox.classList.add('hidden');
      const loginBox = document.querySelector('.login-box');
      if (loginBox) loginBox.classList.remove('hidden');
    });
  }
}

// Toggle between login & signup
const showSignup = document.getElementById('showSignup');
if (showSignup) {
  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    const loginBox = document.querySelector('.login-box');
    if (loginBox) loginBox.classList.add('hidden');
    if (signupBox) signupBox.classList.remove('hidden');
  });
}
const showLogin = document.getElementById('showLogin');
if (showLogin) {
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    if (signupBox) signupBox.classList.add('hidden');
    const loginBox = document.querySelector('.login-box');
    if (loginBox) loginBox.classList.remove('hidden');
  });
}

// Store users in localStorage (for demo)
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function renderImpactChart() {
  const ctx = document.getElementById('impactChart');
  if (!ctx) return;
  const counts = {
    new: reports.filter(r => r.status === "new").length,
    verified: reports.filter(r => r.status === "verified").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['New', 'Verified', 'Resolved'],
      datasets: [{
        label: '# of Reports',
        data: [counts.new, counts.verified, counts.resolved],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
      }]
    }
  });
}

const tasks = [
  { title: "Beach cleanup drive", assigned: "" },
  { title: "Tree plantation event", assigned: "" },
  { title: "Plastic waste audit", assigned: "" }
];

function renderTasks() {
  const tbody = document.querySelector("#taskTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  tasks.forEach((t, idx) => {
    tbody.innerHTML += `
      <tr>
        <td class="p-2">${t.title}</td>
        <td class="p-2">${t.assigned || "Unassigned"}</td>
        <td class="p-2">
          <button onclick="claimTask(${idx})" ${t.assigned ? "disabled" : ""}>Claim</button>
        </td>
      </tr>
    `;
  });
}
function claimTask(idx) {
  const name = prompt("Enter your name to claim this task:");
  if (name) {
    tasks[idx].assigned = name;
    renderTasks();
  }
}
renderTasks();

const verified = 4, resolved = 3, pending = 12;
const metricsChart = document.getElementById('metricsChart');
if (metricsChart) {
  const ctx = metricsChart.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Pending','Verified','Resolved'],
      datasets: [{
        label: 'Reports',
        data: [pending, verified, resolved],
        backgroundColor: ['#f87171','#60a5fa','#34d399']
      }]
    }
  });
  const resolutionRate = Math.round((resolved/(pending+verified+resolved))*100);
  const resolutionBar = document.getElementById("resolutionBar");
  if (resolutionBar) resolutionBar.style.width = resolutionRate+"%";
}

// Sample pending reports (in real app, fetch from backend/localStorage)
let pendingReports = [
  { name: "Ravi", category: "Plastic", description: "Plastic dumped near river", location: "Kolkata" },
  { name: "Ananya", category: "Pollution", description: "Factory smoke in area", location: "Delhi" }
];

const tableBody = document.querySelector("#verifyTable tbody");
if (tableBody) {
  function loadPendingReports() {
    tableBody.innerHTML = "";
    pendingReports.forEach((report, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${report.name}</td>
        <td>${report.category}</td>
        <td>${report.description}</td>
        <td>${report.location}</td>
        <td><button class="verify-btn bg-green-500 text-white px-3 py-1 rounded" data-index="${index}">Verify</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Only create map if verifiedMap exists
  const verifiedMapDiv = document.getElementById("verifiedMap");
  let verifiedMap;
  if (verifiedMapDiv) {
    verifiedMap = L.map("verifiedMap").setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(verifiedMap);
  }

  function getCoordinates(location) {
    // Dummy: returns random coordinates for demo
    const cities = {
      Kolkata: [22.57, 88.36],
      Delhi: [28.61, 77.23],
      Mumbai: [19.07, 72.87],
      Chennai: [13.08, 80.27]
    };
    return cities[location] || [20.59, 78.96];
  }

  function verifyReport(index) {
    const report = pendingReports[index];
    let coords = getCoordinates(report.location);
    if (coords && verifiedMap) {
      L.marker(coords)
        .addTo(verifiedMap)
        .bindPopup(`<b>${report.category}</b><br>${report.description}<br>${report.location}`);
    }
    pendingReports.splice(index, 1);
    loadPendingReports();
  }

  tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("verify-btn")) {
      const index = e.target.getAttribute("data-index");
      verifyReport(index);
    }
  });

  loadPendingReports();
}