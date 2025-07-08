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

  // Save to Firestore
  await addDoc(collection(db, "sessions"), {
    employeeId: currentUser.uid,
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    duration: duration
  });

  startBtn.disabled = false;
  endBtn.disabled = true;
  elapsed = 0;
  updateCircularTimerDisplay(elapsed);
  progressCircle.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
  loadSessions();
};

// Load only this user's sessions
async function loadSessions() {
  const tableBody = document.querySelector('#sessionTable tbody');
  tableBody.innerHTML = "";
  const q = query(collection(db, "sessions"), where("employeeId", "==", currentUser.uid));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateTime(data.start)}</td>
      <td>${formatDateTime(data.end)}</td>
      <td>${data.duration}</td>
    `;
    tableBody.appendChild(row);
  });
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
