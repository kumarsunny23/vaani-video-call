// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJf08yMgwGmpWQYiRrZThhKuhInta00t8",
  authDomain: "vaani-video.firebaseapp.com",
  projectId: "vaani-video",
  storageBucket: "vaani-video.firebasestorage.app",
  messagingSenderId: "209359032517",
  appId: "1:209359032517:web:233e66061daadff16f60ac",
  measurementId: "G-9LD4DTHSJ2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);