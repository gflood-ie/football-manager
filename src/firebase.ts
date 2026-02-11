import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check
// preventing abuse by verifying that requests are coming from your authentic app
// You must register your site in the Firebase Console -> App Check -> Apps -> Register
// And get a reCAPTCHA v3 site key.
try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY_HERE'),
        isTokenAutoRefreshEnabled: true
    });
} catch (error) {
    console.log("App Check init error (expected without valid key):", error);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
