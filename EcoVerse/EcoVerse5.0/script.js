// Switch Sections
function showForm() {
  hideAll();
  document.getElementById("reportSection").classList.remove("hidden");
}
function showMap() {
  hideAll();
  document.getElementById("mapSection").classList.remove("hidden");
  initMap();
  // Fix map sizing after showing
  requestAnimationFrame(() => {
    if (map) map.invalidateSize();
  });
}
function showLeaderboard() {
  hideAll();
  document.getElementById("leaderboardSection").classList.remove("hidden");
}
function hideAll() {
  document.getElementById("reportSection").classList.add("hidden");
  document.getElementById("mapSection").classList.add("hidden");
  document.getElementById("leaderboardSection").classList.add("hidden");
  document.getElementById("quizSection").classList.add("hidden");
  document.getElementById("dashboardSection").classList.add("hidden");
  document.querySelector('.login-box').classList.add("hidden");
}

// Store reports in memory
let reports = [];
// Track EcoPoints
let scores = {};
let previousOrder = []; // array of names in previous sort order
// Badge thresholds
const BADGE_LEVELS = [
  { min: 100, label: "🥇 Gold" },
  { min: 50,  label: "🥈 Silver" },
  { min: 25,  label: "🥉 Bronze" },
];

function getBadgeFor(points) {
  for (const b of BADGE_LEVELS) {
    if (points >= b.min) return b.label;
  }
  return ""; // no badge yet
}
function submitReport(event) {
  event.preventDefault();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;
  const location = document.getElementById("location").value;
  const reporter = document.getElementById("reporterName").value;
  // For demo: use a random coordinate around Kolkata
  let lat = 22.57 + (Math.random() - 0.5) * 0.2;
  let lng = 88.36 + (Math.random() - 0.5) * 0.2;

  let report = { reporter, category, description, location, lat, lng, status: "new" };
  reports.push(report);
  if (!map) initMap();

  // Create marker with status color + popup buttons
 const emoji = categoryEmoji(category);
 let marker = L.marker([lat, lng], { icon: makeDivIcon(emoji, report.status) })
  .addTo(map)
  .bindPopup(`
  <b>${category}</b><br>
  ${description}<br>
  📍 ${location}<br>
  Reporter: ${reporter}<br>
  Status: ${statusLabel("new")}<br><br>
  <button onclick="updateStatus(${reports.length - 1}, 'verified')">✅ Verify</button>
  <button onclick="updateStatus(${reports.length - 1}, 'resolved')">✔ Resolve</button>
`);

  // Store marker inside report for later updates
  report.marker = marker;
  // Give EcoPoints to reporter
  addPoints(reporter, 5);
  alert("Report submitted! Check the map to see your pin.");
  document.querySelector("form").reset();
// If map exists, fix its sizing
  if (map) {
    requestAnimationFrame(() => map.invalidateSize());
}
}

function categoryEmoji(catRaw) {
  const cat = (catRaw || "").toLowerCase();
  if (cat.includes("plastic") || cat.includes("garbage") || cat.includes("trash")) return "🗑️";
  if (cat.includes("pollution") || cat.includes("smoke")) return "☣️";
  if (cat.includes("plant") || cat.includes("tree")) return "🌱";
  if (cat.includes("water") || cat.includes("river") || cat.includes("lake")) return "💧";
  if (cat.includes("wildlife") || cat.includes("animal")) return "🐾";
  return "📍";
}
function makeDivIcon(emoji, status) {
  const border = status === "resolved" ? "#22c55e" : status === "verified" ? "#f59e0b" : "#ef4444";
  const bg = status === "resolved" ? "#dcfce7" : status === "verified" ? "#fef3c7" : "#fee2e2";
  const html = `
    <div style="display:flex;align-items:center;justify-content:center;
                width:34px;height:34px;border:2px solid ${border};
                background:${bg};border-radius:50%;font-size:18px;">
      ${emoji}
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30] });
}
// Initialize map
// Initialize map
let map;

// Ensure map resizes properly when window size changes
window.addEventListener("resize", () => {
  if (map) map.invalidateSize();
});

function initMap() {

  if (!map) {
    map = L.map("map").setView([22.57, 88.36], 5); // Center on India
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // Add sample marker
    L.marker([22.57, 88.36]).addTo(map).bindPopup("Sample Report: Kolkata");
  }
}

function getMarkerIcon(status) {
  let color;
  if (status === "new") color = "red";
  else if (status === "verified") color = "orange";
  else if (status === "resolved") color = "green";

  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

function updateStatus(index, newStatus) {
  reports[index].status = newStatus;
  let report = reports[index];
  report.marker.setIcon(makeDivIcon(categoryEmoji(report.category), newStatus));
  let statusEmoji = newStatus === "new" ? "🟥 NEW" :
                  newStatus === "verified" ? "🟧 VERIFIED" :
                  "🟩 RESOLVED";
report.marker.setPopupContent(`
  <b>${report.category}</b><br>
  ${report.description}<br>
  📍 ${report.location}<br>
  Reporter: ${report.reporter}<br>
  Status: ${statusEmoji}
`);
  if (newStatus === "verified") {
    let verifier = prompt("Enter verifier name:");
    if (!verifier) return; // cancelled
    report.verifier = verifier;
    addPoints(verifier, 10);
  } 
  else if (newStatus === "resolved") {
    let resolver = prompt("Enter resolver name:");
    if (!resolver) return; // cancelled
    report.resolver = resolver;
    addPoints(resolver, 15);
  }

  report.status = newStatus;
  report.marker.setIcon(getMarkerIcon(newStatus));

  // Rebuild popup with updated info
  let popupHTML = `
    <b>${report.category}</b><br>
    ${report.description}<br>
    📍 ${report.location}<br>
    Reporter: ${report.reporter || "Unknown"}<br>
    Status: ${statusLabel(report.status)}<br>
    ${report.verifier ? "Verifier: " + report.verifier + "<br>" : ""}
    ${report.resolver ? "Resolver: " + report.resolver + "<br>" : ""}
  `;

  // Only show buttons if not resolved
  if (report.status !== "resolved") {
    popupHTML += `
      <br>
      <button onclick="updateStatus(${index}, 'verified')">✅ Verify</button>
      <button onclick="updateStatus(${index}, 'resolved')">✔ Resolve</button>
    `;
  }

  report.marker.setPopupContent(popupHTML);
}

function statusLabel(status) {
  if (status === "new") return "🟥 NEW";
  if (status === "verified") return "🟧 VERIFIED";
  if (status === "resolved") return "🟩 RESOLVED";
  return status;
}

function addPoints(name, points) {
  if (!scores[name]) scores[name] = 0;
  scores[name] += points;
  updateLeaderboard();
}

function updateLeaderboard() {
  let table = document.getElementById("leaderboardTable");
  table.innerHTML = "";

  // Sort by highest points
  let sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([name, pts], index) => {
  let rank;
  if (index === 0) rank = "🥇";
  else if (index === 1) rank = "🥈";
  else if (index === 2) rank = "🥉";
  else rank = (index + 1).toString();

  let row = `
    <tr>
      <td class="p-2 border">${rank}</td>
      <td class="p-2 border">${name}</td>
      <td class="p-2 border">${pts}</td>
    </tr>`;
  table.innerHTML += row;
  });
}

function showQuiz() {
  hideAll();
  document.getElementById("quizSection").classList.remove("hidden");
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
  if (currentQ >= quizQuestions.length) {
    // Quiz finished
    let player = prompt("Enter your name to claim EcoPoints:");
    if (player) {
      addPoints(player, quizScore * 2); // 10 EcoPoints per correct
      alert(`You earned ${quizScore * 2} EcoPoints!`);
    }
    document.getElementById("quizContainer").innerHTML = "";
    return;
  }

  let qObj = quizQuestions[currentQ];
  let container = document.getElementById("quizContainer");
  container.innerHTML = `
    <p class="font-semibold">${qObj.q}</p>
    <div id="options">
      ${qObj.options.map((opt, i) =>
        `<button onclick="submitAnswer(${i})" 
          class="block w-full text-left p-3 border rounded mb-2 hover:bg-gray-100">${opt}</button>`
      ).join("")}
    </div>
    <p id="feedback" class="mt-2 font-semibold"></p>
  `;
}

function submitAnswer(selected) {
  let correctIndex = quizQuestions[currentQ].answer;
  let correctText = quizQuestions[currentQ].options[correctIndex];
  let feedback = document.getElementById("feedback");

  // disable all buttons once answered
  let buttons = document.querySelectorAll("#options button");
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correctIndex) {
      // highlight correct option
      btn.classList.add("bg-green-200", "border-green-600");
    }
    if (i === selected && selected !== correctIndex) {
      // highlight wrong selection
      btn.classList.add("bg-red-200", "border-red-600");
    }
  });

  if (selected === correctIndex) {
    feedback.textContent = "✅ Correct! +10 points";
    feedback.className = "mt-2 font-semibold text-green-600";
    quizScore++;
  } else {
    feedback.textContent = `❌ Wrong! The correct answer is: ${correctText}`;
    feedback.className = "mt-2 font-semibold text-red-600";
  }

  // Add "Next Question" button
  feedback.innerHTML += `<br><button onclick="nextQuestion()" class="mt-3 px-4 py-2 bg-blue-500 text-white rounded">Next Question</button>`;
}

function nextQuestion() {
  currentQ++;
  renderQuestion();
}

function showDashboard() {
  hideAll();
  document.getElementById("dashboardSection").classList.remove("hidden");
  renderImpactChart();
}

// LOGIN LOGIC 
const loginForm = document.querySelector('.login-box form');
const loginUsername = loginForm.querySelector('input[type="text"]');
const loginPassword = loginForm.querySelector('input[type="password"]');
const loginButton = loginForm.querySelector('a.button');

loginButton.addEventListener('click', function(e) {
  e.preventDefault(); // prevent default link navigation

  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  // For demo: mock authentication; replace with real backend later
  if (username === "admin" && password === "admin") {
    alert(`Welcome, ${username}!`);
    // Hide login and show dashboard/home
    document.querySelector('.login-box').classList.add('hidden');
    showDashboard(); // or showMap(), etc.
  } else {
    alert("Invalid credentials (try admin/admin for demo)");
  }
});

// SIGNUP LOGIC
const signupBox = document.querySelector('.signup-box');
const signupForm = signupBox.querySelector('form');
const signupUsername = signupForm.querySelector('input[type="text"]');
const signupPassword = signupForm.querySelector('input[type="password"]');
const signupButton = signupForm.querySelector('a.button');

// Toggle between login & signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('.login-box').classList.add('hidden');
  signupBox.classList.remove('hidden');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  signupBox.classList.add('hidden');
  document.querySelector('.login-box').classList.remove('hidden');
});

// Store users in localStorage (for demo)
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

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
  document.querySelector('.login-box').classList.remove('hidden');
});

// Modify login logic to check localStorage users
loginButton.addEventListener('click', function(e) {
  e.preventDefault();
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();
  const users = getUsers();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  // Check localStorage OR admin default
  if ((users[username] && users[username] === password) || (username === "admin" && password === "admin")) {
    alert(`Welcome, ${username}!`);
    document.querySelector('.login-box').classList.add('hidden');
    signupBox.classList.add('hidden');
    showDashboard();
    // Auto-fill reporter name for convenience
    document.getElementById("reporterName").value = username;
  } else {
    alert("Invalid credentials.");
  }
});


function renderImpactChart() {
  const ctx = document.getElementById('impactChart');
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
