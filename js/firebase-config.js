import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCE4w2DsRH3jLmFUq8Mw1kT3cZtk9xivLQ",
  authDomain: "dmov2-0.firebaseapp.com",
  databaseURL: "https://dmov2-0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dmov2-0",
  storageBucket: "dmov2-0.firebasestorage.app",
  messagingSenderId: "708837310672",
  appId: "1:708837310672:web:350ead9eea21cdc9501ed5",
  measurementId: "G-NJ01FQT255"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export { ref, onValue, set, push, remove };