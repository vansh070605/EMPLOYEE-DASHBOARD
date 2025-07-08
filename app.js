import { db } from './firebase-config.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function deleteSession(docId) {
  await deleteDoc(doc(db, "sessions", docId));
}


let startTime, timerInterval;

// Timer logic
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const timerDisplay = document.getElementById('timerDisplay');

startBtn.onclick = () => {
  startTime = new Date();
  timerInterval = setInterval(() => {
    const now = new Date();
    const diff = now - startTime;
    timerDisplay.textContent = new Date(diff).toISOString().substr(11, 8);
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
    employeeId: "employee1", // Replace with dynamic employee ID if available
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    duration: duration
  });

  startBtn.disabled = false;
  endBtn.disabled = true;
  timerDisplay.textContent = "00:00:00";
  loadSessions(); // Refresh session logs
};

// Load sessions into the table
async function loadSessions() {
  const tableBody = document.querySelector('#sessionTable tbody');
  tableBody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "sessions"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement('tr');
    row.innerHTML = `
  <td data-label="Employee">${data.employeeId}</td>
  <td data-label="Start Time">${formatDateTime(data.start)}</td>
  <td data-label="End Time">${formatDateTime(data.end)}</td>
  <td data-label="Duration">${data.duration}</td>
  <td data-label="Action"><button class="deleteBtn" data-id="${doc.id}">Delete</button></td>
`;


    tableBody.appendChild(row);
  });

  // Attach event listeners to all delete buttons
  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.onclick = async function() {
      const docId = this.getAttribute('data-id');
      await deleteSession(docId);
      loadSessions(); // Refresh the table
    };
  });
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  // Format: 08 Jul 2025, 12:25 PM
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}



// Initial load
loadSessions();
