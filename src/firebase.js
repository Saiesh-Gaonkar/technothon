// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMGeqjzvAY2MpXupxdIWPyTFoE0MC7EYs",
  authDomain: "tourism-app-7b3f7.firebaseapp.com",
  projectId: "tourism-app-7b3f7",
  storageBucket: "tourism-app-7b3f7.firebasestorage.app",
  messagingSenderId: "24077018562",
  appId: "1:24077018562:web:72395ad98138cfd3bee25b",
  measurementId: "G-JPSBRMGF32",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize the Vertex AI service
const vertexAI = getVertexAI(app);

// Initialize the generative model with a model that supports your use case
export const geminiModel = getGenerativeModel(vertexAI, {
  model: "gemini-2.0-flash",
});
