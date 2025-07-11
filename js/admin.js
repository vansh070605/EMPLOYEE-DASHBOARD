import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Directly load all session logs for public viewing
loadSessions();

// Fetch all users and build a UID→name map
async function getUserMap() {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const userMap = {};
  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    userMap[doc.id] = data.name || data.email || doc.id;
  });
  return userMap;
}

// Load all sessions into the table with employee names
async function loadSessions() {
  const tableBody = document.querySelector('#sessionTable tbody');
  tableBody.innerHTML = "";

  const userMap = await getUserMap();
  const sessionsSnapshot = await getDocs(collection(db, "sessions"));
  const sessions = [];
  sessionsSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    sessions.push({ id: docSnap.id, ...data });
  });

  // Sort sessions by start time (latest first)
  sessions.sort((a, b) => new Date(b.start) - new Date(a.start));

  sessions.forEach((data) => {
    const employeeName = userMap[data.employeeId] || data.employeeId;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Employee">${employeeName}</td>
      <td data-label="Start Time">${formatDateTime(data.start)}</td>
      <td data-label="End Time">${formatDateTime(data.end)}</td>
      <td data-label="Duration">${data.duration}</td>
      <td data-label="Action"><button class="deleteBtn" data-id="${data.id}">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });

  // Attach delete event listeners
  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.onclick = async function() {
      const docId = this.getAttribute('data-id');
      await deleteDoc(doc(db, "sessions", docId));
      loadSessions(); // Refresh the table
    };
  });
}

function formatDateTime(isoString) {
  if (!isoString) return "";
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
