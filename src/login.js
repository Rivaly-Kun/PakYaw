import { initializeApp } from "firebase/app"
import {
    getFirestore,
    collection, addDoc, Timestamp
} from "firebase/firestore"
import {
    createUserWithEmailAndPassword,
    getAuth,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth"

import { AuthRouter} from '../src/auth_state'

const firebaseConfig = {
    apiKey: "AIzaSyA6_3d88atEhHcUA0UjDsLxzZ0pEhJgA9c",
    authDomain: "ride-hailing-app-68e81.firebaseapp.com",
    projectId: "ride-hailing-app-68e81",
    storageBucket: "ride-hailing-app-68e81.appspot.com",
    messagingSenderId: "704173359839",
    appId: "1:704173359839:web:84bc81ebbc2253b8fb5f6a",
    measurementId: "G-SGV6EXYW9M"
};

initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

const routeConfig = {
    patterns: [
        // Login page (public)
        {
            pattern: /^\/system\/login\.html$/,
            requiresAuth: false,
            isAuthPage: true
        },
        
        // All other system routes (protected)
        {
            pattern: /^\/system\/file-maintainance\/.*/,
            requiresAuth: true
        },
        {
            pattern: /^\/system\/utilities\/.*/,
            requiresAuth: true
        },
        {
            pattern: /^\/system\/reports\/.*/,
            requiresAuth: true
        },
        {
            pattern: /^\/system\/reports\/report-submenu\/.*/,
            requiresAuth: true
        },
        {
            pattern: /^\/system\/index\.html$/,
            requiresAuth: true
        },
        // Catch-all for any other System folder content
        {
            pattern: /^\/system\/.*/,
            requiresAuth: true
        }
    ],
    defaults: {
        home: '/system/index.html',
        login: '/system/login.html'
    }
};

const AdminCol = collection(db, "Admin");
const container = document.getElementById("loginForm");
const loginForm = document.getElementById("LoginForm");

// Create router instance but don't initialize yet
const router = new AuthRouter(auth, routeConfig);

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('user signed in', userCredential.user);
        
        // Log the successful login
        await addDoc(collection(db, 'AdminLogs'), {
            user_id: userCredential.user.uid,
            category: 'Login',
            action: `${userCredential.user.displayName || 'A user'} Logged In`,
            actionTime: Timestamp.now(),
        });

        document.getElementById('Error').innerText = '';
        loginForm.reset();
        container.style.display = 'none';
        
        // Only initialize router after logging is complete
        router.initialize();

    } catch (err) {
        console.log(err.message);
        if (err.code === 'auth/invalid-credential') {
            document.getElementById('Error').innerText = 'Incorrect email or password. Try again.';
            try {
                await addDoc(collection(db, 'AdminLogs'), {
                    user_id: 'unknown',
                    category: 'Login',
                    action: `Failed login attempt with email: ${email}`,
                    actionTime: Timestamp.now(),
                });
            } catch (logError) {
                console.error('Failed to log login attempt:', logError);
            }
        }
    }
});

// Initialize router for other pages
if (window.location.pathname !== '/system/login.html') {
    router.initialize();
}

// Cleanup when page is unloaded
window.addEventListener('unload', () => {
    router.cleanup();
});