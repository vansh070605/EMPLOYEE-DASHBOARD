// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtc0tjqlXitidvFmnfrE5uC8-tQu8C3wE",
  authDomain: "employee-dashboard-9bfc6.firebaseapp.com",
  projectId: "employee-dashboard-9bfc6",
  storageBucket: "employee-dashboard-9bfc6.firebasestorage.app",
  messagingSenderId: "676185557200",
  appId: "1:676185557200:web:78933131b10c73b17c36d5",
  measurementId: "G-CD8N2G76NM"
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

