import { initializeApp } from "firebase/app"
import {
    getAuth,
    signOut, onAuthStateChanged, signInWithEmailAndPassword, updateProfile
} from "firebase/auth"
import { 
    getFirestore,
    collection, 
    query, 
    where, 
    getCountFromServer,
    Timestamp,
    onSnapshot,
    getDocs,
    doc, 
    addDoc,
    limit,
    orderBy
  } from 'firebase/firestore';

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
const auth = getAuth();
const db = getFirestore();
let userId = '';
let displayName = '';
const signOutButton = document.getElementById('signout');
if (signOutButton) {
    signOutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await addDoc(collection(db, 'AdminLogs'), {
            user_id: userId,
            category: 'Sign out',
            action: `${displayName} Signed Out `,
            actionTime: Timestamp.now(),
        });
        signOut(auth)
            .then(() => {
                console.log('The user has signed out.');
            })
            .catch((err) => {
                console.log(err.message);
            });
    });
}

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

export class AuthRouter {
    constructor(firebaseAuth, routeConfiguration) {
        this.auth = firebaseAuth;
        this.config = routeConfiguration;
        this.currentUser = null;
        this.unsubscribe = null; // Store the unsubscribe function
    }

    initialize() {
        if (this.unsubscribe) {
            // If already initialized, unsubscribe first
            this.unsubscribe();
        }
        
        this.unsubscribe = this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            this.handleNavigation();
            console.log(user);
        });
    }

    // Method to stop listening to auth changes
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    handleNavigation() {
        const currentPath = window.location.pathname.replace(/\/+/g, '/');
        const routeAccess = this.getRouteAccess(currentPath);

        console.log('Current path:', currentPath);
        console.log('Route access:', routeAccess);

        if (!this.currentUser && routeAccess.requiresAuth) {
            console.log('Redirecting to login: Not authenticated');
            this.redirectTo(this.config.defaults.login);
            return;
        }

        if (this.currentUser && routeAccess.isAuthPage) {
            console.log('Redirecting to home: Already authenticated');
            this.redirectTo(this.config.defaults.home);
            return;
        }
    }

    getRouteAccess(path) {
        const matchedRoute = this.config.patterns.find(route => 
            route.pattern.test(path)
        );
        return matchedRoute || { requiresAuth: true };
    }

    redirectTo(path) {
        if (window.location.pathname.replace(/\/+/g, '/') !== path) {
            window.location.href = path;
        }
    }
}

function formatTimestampIntl(timestamp) {
    const date = new Date(timestamp.toDate());
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

const notiCol = query(collection(db, 'Notifications'), orderBy('createdAt', 'desc'), limit(1));
const mesCol = query(collection(db, 'UserReports'), orderBy('createdAt', 'desc'), limit(1));
console.log('hello 4');
window.onload = function(){
    console.log('hello 3');
    if(window.location.pathname.replace(/\/+/g, '/') !== '/system/login.html'){
        const router = new AuthRouter(auth, routeConfig);
        router.initialize();
        onAuthStateChanged(auth, user => {
            document.getElementById('User').innerText = 'Hi, ' + user.displayName;
            userId = user.uid;
            displayName = user.displayName;
        })
        console.log('hello 2');
        document.getElementById('toggleNotification').onclick = function (event){
            document.getElementById('notify').style.display = 'none';
        }
        document.getElementById('toggleMessage').onclick = function (event){
            document.getElementById('Message').style.display = 'none';
        }
        onSnapshot(mesCol, (snapshot) => {
            if(snapshot.empty){
                document.getElementById('emptyOrNot2').setAttribute('class', 'py-2 px-4');
                document.getElementById('emptyOrNot2').innerHTML = `<h4>No messages currently.</h4>`;
            }else{
                let latestDoc = snapshot.docs.at(0);
                let docu = latestDoc.data();
                let status = snapshot.docChanges().at(0);
                if(status.type == 'modified'){
                    document.getElementById('message2').style.display = 'inline-block';
                }
                document.getElementById('dateNew2').innerText = formatTimestampIntl(docu.createdAt);
                document.getElementById('message2').innerText = docu.message.substring(0, 50) + '...';
            }
        })
        onSnapshot(notiCol, (snapshot) => {
            if(snapshot.empty){
                document.getElementById('emptyOrNot').setAttribute('class', 'py-2 px-4');
                document.getElementById('emptyOrNot').innerHTML = `<h4>No notifications currently.</h4>`;
            }else{
                let latestDoc = snapshot.docs.at(0);
                let docu = latestDoc.data();
                let status = snapshot.docChanges().at(0);
                if(status.type == 'modified'){
                    document.getElementById('notify').style.display = 'inline-block';
                }
                document.getElementById('dateNew').innerText = formatTimestampIntl(docu.createdAt);
                document.getElementById('message').innerText = docu.message.substring(0, 50) + '...';
            }
        })
    }
}