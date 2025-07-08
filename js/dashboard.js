import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUser = null;

// Auth state check
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // Fetch user's name from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    document.getElementById('userEmail').textContent = userData.name || user.email;
    loadSessions();
  } else {
    window.location.href = "login.html";
  }
});

// Logout
document.getElementById('logoutBtn').onclick = () => {
  signOut(auth);
};

// Circular timer logic
let startTime, timerInterval, elapsed = 0;
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const timerLabel = document.getElementById('timerLabel');

// Circular progress setup
const RADIUS = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const progressCircle = document.querySelector('.progress-ring__circle');
progressCircle.setAttribute('stroke-dasharray', CIRCUMFERENCE);
progressCircle.setAttribute('stroke-dashoffset', CIRCUMFERENCE);

function updateCircularTimerDisplay(seconds) {
  // Format as hh:mm:ss
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  timerLabel.textContent = `${h}:${m}:${s}`;

  // Progress: for stopwatch, just loop the progress every minute
  const progress = (seconds % 60) / 60; // progress in one minute
  const dashoffset = CIRCUMFERENCE * (1 - progress);
  progressCircle.setAttribute('stroke-dashoffset', dashoffset);
}

startBtn.onclick = () => {
  startTime = new Date();
  elapsed = 0;
  updateCircularTimerDisplay(elapsed);
  progressCircle.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
  timerInterval = setInterval(() => {
    elapsed = Math.floor((new Date() - startTime) / 1000);
    updateCircularTimerDisplay(elapsed);
  }, 1000);
  startBtn.disabled = true;
  endBtn.disabled = false;
};

endBtn.onclick = async () => {
  clearInterval(timerInterval);
  const endTime = new Date();
  const duration = new Date(endTime - startTime).toISOString().substr(11, 8);

  // Get tag and note values
  const tag = document.getElementById('sessionTag').value.trim();
  const note = document.getElementById('sessionNote').value.trim();

  // Save to Firestore
  await addDoc(collection(db, "sessions"), {
    employeeId: currentUser.uid,
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    duration: duration,
    tag: tag,
    note: note
  });

  startBtn.disabled = false;
  endBtn.disabled = true;
  elapsed = 0;
  updateCircularTimerDisplay(elapsed);
  progressCircle.setAttribute('stroke-dashoffset', CIRCUMFERENCE);

  // Clear tag and note inputs
  document.getElementById('sessionTag').value = "";
  document.getElementById('sessionNote').value = "";

  loadSessions();
};

// Load only this user's sessions and update analytics
async function loadSessions() {
  const tableBody = document.querySelector('#sessionTable tbody');
  tableBody.innerHTML = "";

  const sessions = [];
  const q = query(collection(db, "sessions"), where("employeeId", "==", currentUser.uid));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    sessions.push({ ...data, employeeId: currentUser.uid });
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateTime(data.start)}</td>
      <td>${formatDateTime(data.end)}</td>
      <td>${data.duration}</td>
      <td>${data.tag || ''}</td>
      <td>${data.note || ''}</td>
    `;
    tableBody.appendChild(row);
  });

  // For this user's analytics, use their name
  const userMap = {};
  userMap[currentUser.uid] = document.getElementById('userEmail').textContent;
  const totals = aggregateHours(sessions, userMap);
  renderHoursChart(totals);
}

// Format date/time for display
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Aggregate total hours for analytics chart
function aggregateHours(sessions, userMap) {
  const totals = {};
  sessions.forEach((session) => {
    const name = userMap[session.employeeId] || session.employeeId;
    if (!session.duration) return; // Skip if no duration
    // Parse duration as "hh:mm:ss"
    const parts = session.duration.split(':').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return; // Skip malformed
    const [h, m, s] = parts;
    const hours = h + m / 60 + s / 3600;
    totals[name] = (totals[name] || 0) + hours;
  });
  return totals;
}

// Render the Chart.js bar chart
function renderHoursChart(totals) {
  const ctx = document.getElementById('hoursChart').getContext('2d');

  // Destroy existing chart instance if any to avoid duplicates
  if (window.hoursChartInstance) {
    window.hoursChartInstance.destroy();
  }

  const labels = Object.keys(totals);
  const dataValues = Object.values(totals);

  // Handle empty data case
  if (labels.length === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  window.hoursChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Hours Worked (This Month)',
        data: dataValues,
        backgroundColor: '#2563eb'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours' }
        }
      }
    }
  });
}
