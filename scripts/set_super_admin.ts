
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'gflood@gmail.com';
const password = 'Password123!';

async function setupAdmin() {
    console.log(`Setting up super admin for: ${email}`);
    let user;

    try {
        console.log("Attempting to create user...");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        user = credential.user;
        console.log("User created successfully.");
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("User already exists. Attempting to sign in...");
            try {
                const credential = await signInWithEmailAndPassword(auth, email, password);
                user = credential.user;
                console.log("Signed in successfully.");
            } catch (signinError: any) {
                console.error("Could not sign in with the provided password. If you verified this account previously, the password might be different.");
                console.error("Error:", signinError.code, signinError.message);
                process.exit(1);
            }
        } else {
            console.error("Error creating user:", error);
            process.exit(1);
        }
    }

    if (user) {
        console.log(`Updating user profile for UID: ${user.uid} to 'super_admin'...`);
        try {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                role: 'super_admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
            console.log("SUCCESS! User is now a Super Admin.");
            console.log("------------------------------------------------");
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log("------------------------------------------------");
        } catch (dbError) {
            console.error("Error updating Firestore:", dbError);
        }
    }
    process.exit(0);
}

setupAdmin();
