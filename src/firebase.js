// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMGeqjzvAY2MpXupxdIWPyTFoE0MC7EYs",
  authDomain: "tourism-app-7b3f7.firebaseapp.com",
  projectId: "tourism-app-7b3f7",
  storageBucket: "tourism-app-7b3f7.appspot.com",
  messagingSenderId: "24077018562",
  appId: "1:24077018562:web:72395ad98138cfd3bee25b",
  measurementId: "G-JPSBRMGF32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the services
export { db };

// Initialize Gemini in a separate file to avoid conflicts
