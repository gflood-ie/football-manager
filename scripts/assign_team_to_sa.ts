import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBzppkPRzuZtTsOKR7Dy9WpWLNv9Qhblts",
    authDomain: "playermanager-a4944.firebaseapp.com",
    projectId: "playermanager-a4944",
    storageBucket: "playermanager-a4944.firebasestorage.app",
    messagingSenderId: "865244536997",
    appId: "1:865244536997:web:d1dbd5bc2913c4a0ffad4c",
    measurementId: "G-4ETBST8SSH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'gflood@gmail.com';
const password = 'Password123!';

async function setupSuperAdminTeam() {
    console.log(`Setting up team for super admin: ${email}`);

    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = credential.user;
        const uid = user.uid;

        console.log(`User logged in. UID: ${uid}`);

        // 1. Create Team if needed
        // We'll just create a new one to be sure or update preference.
        // Let's see if user already has a team.
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        let teamId = userDocSnap.exists() ? userDocSnap.data().teamId : null;

        if (!teamId) {
            console.log("User has no team. Creating 'Daon FC'...");
            const teamRef = await addDoc(collection(db, 'teams'), {
                name: 'Daon FC',
                yearBorn: '2014',
                managerId: uid,
                createdAt: new Date().toISOString()
            });
            teamId = teamRef.id;
            console.log(`Team created with ID: ${teamId}`);
        } else {
            console.log(`User already has team ID: ${teamId}`);
        }

        // 2. Update User Profile
        // Ensure role is super_admin AND they have the teamId
        await setDoc(userDocRef, {
            email: email,
            role: 'super_admin',
            teamId: teamId,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log("SUCCESS! User updated:");
        console.log(`- Role: super_admin`);
        console.log(`- Team ID: ${teamId}`);
        console.log(`- Can now access Manager features.`);

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

setupSuperAdminTeam();
