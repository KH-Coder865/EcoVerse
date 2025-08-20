

// Switch Sections
function showForm() {
  hideAll();
  document.getElementById("reportSection").classList.remove("hidden");
}
function showMap() {
  hideAll();
  document.getElementById("mapSection").classList.remove("hidden");
  initMap();
}
function showLeaderboard() {
  hideAll();
  document.getElementById("leaderboardSection").classList.remove("hidden");
}
function hideAll() {
  document.getElementById("reportSection").classList.add("hidden");
  document.getElementById("mapSection").classList.add("hidden");
  document.getElementById("leaderboardSection").classList.add("hidden");
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

  // For demo: use a random coordinate around Kolkata
  let lat = 22.57 + (Math.random() - 0.5) * 0.2;
  let lng = 88.36 + (Math.random() - 0.5) * 0.2;

  let report = { category, description, location, lat, lng, status: "new" };
  reports.push(report);
  if (!map) initMap();

  // Create marker with status color + popup buttons
 const emoji = categoryEmoji(category);
 let marker = L.marker([lat, lng], { icon: makeDivIcon(emoji, report.status) })
  .addTo(map)
  .bindPopup(`
    <b>${emoji} ${category}</b><br>
    ${description}<br>
    📍 ${location}<br><br>
    <button onclick="updateStatus(${reports.length - 1}, 'verified')">✅ Verify</button>
    <button onclick="updateStatus(${reports.length - 1}, 'resolved')">✔ Resolve</button>
  `);


  // Store marker inside report for later updates
  report.marker = marker;
  // Give EcoPoints to reporter
  addPoints("Reporter", 5);
  alert("Report submitted! Check the map to see your pin.");
  document.querySelector("form").reset();
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
let map;
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
  report.marker.setPopupContent(`
    <b>${report.category}</b><br>
    ${report.description}<br>
    📍 ${report.location}<br><br>
    Status: ${newStatus.toUpperCase()}
  `);
  if (newStatus === "verified") {
   addPoints("Verifier", 10);
  } 
  else if (newStatus === "resolved") {
   addPoints("Resolver", 15);
  }
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
  

  for (let [name, pts] of sorted) {
    const badge = getBadgeFor(pts);
let row = `
  <tr class="transition">
    <td class="p-2 border text-left sm:text-center">${name}</td>
    <td class="p-2 border">
      ${pts} ${badge ? `<span class="ml-2 inline-block text-sm px-2 py-1 rounded-full bg-yellow-100">${badge}</span>` : ""}
    </td>
  </tr>`;
  table.innerHTML += row;

  }
  
}
