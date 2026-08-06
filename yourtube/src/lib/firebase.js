// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWVdRqX0_A0xYq3P6yg24r-4iCxXVOK_Q",
  authDomain: "clone-7241b.firebaseapp.com",
  projectId: "clone-7241b",
  storageBucket: "clone-7241b.firebasestorage.app",
  messagingSenderId: "1044189493632",
  appId: "1:1044189493632:web:6966b813771d7cf054e965",
  measurementId: "G-RF3ND66MN4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
