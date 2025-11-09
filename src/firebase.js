
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// If emulator flag is set, prefer the emulator project id
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
if (useEmulator) {
	// override projectId if not provided to ensure emulator URI matches
	firebaseConfig.projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'local-bandb';
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (useEmulator) {
	try {
		connectFirestoreEmulator(db, 'localhost', 8080);
		connectAuthEmulator(auth, 'http://localhost:9099');
		console.log('Connected to Firebase emulators: firestore @8080, auth @9099');
	} catch (e) {
		console.warn('Failed to connect to emulators:', e.message || e);
	}
}
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, app };
