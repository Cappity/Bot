const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged
} = require('firebase/auth');

// --- Firebase Configuration ---

// These global variables are expected to be provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { apiKey: "DEFAULT_API_KEY" }; // Fallback for local dev
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

// Firestore Collection Path
const LOA_COLLECTION = `/artifacts/${appId}/public/data/loa-requests`;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Authentication Function ---

/**
 * Initializes Firebase authentication and returns the user ID.
 * @returns {Promise<string>} A promise that resolves with the Firebase User ID.
 */
function initializeFirebase() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Firebase auth state changed, user ID:", user.uid);
                resolve(user.uid);
            } else {
                console.log("No Firebase user. Attempting auth.");
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log("Firebase auth successful with custom token.");
                        // onAuthStateChanged will fire again, resolving the promise
                    } else {
                        await signInAnonymously(auth);
                        console.log("Firebase auth successful (anonymously).");
                        // onAuthStateChanged will fire again, resolving the promise
                    }
                } catch (error) {
                    console.error("Firebase auth error:", error);
                    reject(error);
                }
            }
        });
    });
}

module.exports = {
    db,
    auth,
    LOA_COLLECTION,
    initializeFirebase
};
