import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwiOUr5M3Bg85ujvHgGTpMoCQFCo9r_LI",
  authDomain: "moonstone-b7045.firebaseapp.com",
  projectId: "moonstone-b7045",
  storageBucket: "moonstone-b7045.firebasestorage.app",
  messagingSenderId: "669227411364",
  appId: "1:669227411364:web:42974a43b40133985cc331"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
