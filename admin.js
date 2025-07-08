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
