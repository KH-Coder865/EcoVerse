
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



function addPoints(name, points) {
  if (!scores[name]) scores[name] = 0;
  scores[name] += points;
  updateLeaderboard();
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
          class="block w-full text-left p-3 border rounded mb-2 hover:bg-gray-100" style="color: black;">${opt}</button>`
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
      btn.classList.add("bg-green-500", "border-green-600");
    }
    if (i === selected && selected !== correctIndex) {
      // highlight wrong selection
      btn.classList.add("bg-red-500", "border-red-600");
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
  feedback.innerHTML += `<br><button onclick="nextQuestion()" class="mt-3 px-4 mb-4 py-2 bg-blue-500 text-white rounded" style="border: 2px solid black;">Next Question</button>`;
}

function nextQuestion() {
  currentQ++;
  renderQuestion();
}

// Impact Chart (Reports by Category)

