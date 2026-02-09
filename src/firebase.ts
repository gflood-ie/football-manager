import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBzppkPRzuZtTsOKR7Dy9WpWLNv9Qhblts",
    authDomain: "playermanager-a4944.firebaseapp.com",
    projectId: "playermanager-a4944",
    storageBucket: "playermanager-a4944.firebasestorage.app",
    messagingSenderId: "865244536997",
    appId: "1:865244536997:web:d1dbd5bc2913c4a0ffad4c",
    measurementId: "G-4ETBST8SSH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { analytics };
export default app;
