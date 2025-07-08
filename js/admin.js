onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.data().role !== "admin") {
    window.location.href = "auth.html";
  }
  // ...load all users and all session logs
});

const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const timerDisplay = document.getElementById('timerDisplay');

if (startBtn && endBtn && timerDisplay) {
  // Only run timer logic if timer elements exist
  let startTime, timerInterval;

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

    // Save to Firestore (add your logic here)

    startBtn.disabled = false;
    endBtn.disabled = true;
    timerDisplay.textContent = "00:00:00";
    loadSessions();
  };
}
