import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    onAuthStateChanged,
    AuthErrorCodes, 
    updateProfile
} from "firebase/auth";
import { getFirestore, updateDoc, doc } from 'firebase/firestore'

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

function showModal(modalId, customMessage = null) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    const modalBody = modalElement.querySelector('.modal-body');
    if (modalBody && customMessage) {
        modalBody.textContent = customMessage;
    }

    const existingModal = bootstrap.Modal.getInstance(modalElement);
    if (existingModal) {
        existingModal.show();
    } else {
        try {
            const newModal = new bootstrap.Modal(modalElement);
            newModal.show();
        } catch (error) {
            console.error('Modal initialization error:', error);
            alert(customMessage); // Fallback to alert if modal fails
        }
    }
}

function getErrorMessage(error) {
    console.log('Firebase error code:', error.code); // For debugging
    
    switch (error.code) {
        case 'auth/invalid-credential':
            return "The current password you entered is incorrect. Please verify and try again.";
        case 'auth/too-many-requests':
            return "Too many unsuccessful attempts. Please try again later.";
        case 'auth/requires-recent-login':
            return "For security reasons, please log out and log back in before changing your password.";
        case 'auth/weak-password':
            return "The new password must be at least 6 characters long.";
        default:
            return `Password update failed: ${error.message}`;
    }
}

onAuthStateChanged(auth, user => {
    if (!user) {
        console.log("No user signed in");
        return;
    }

    // Set email and date
    document.getElementById('UserName').innerText = 'Hi, ' + user.displayName;
    document.getElementById('UserID').innerText = 'User-' + user.uid.substring(0, 8);
    const emailInput = document.getElementById('email');
    const dateElement = document.getElementById('dateCreated');
    
    if (emailInput && user.email) {
        emailInput.value = user.email;
    }
    
    if (dateElement && user.metadata.creationTime) {
        const date = new Date(user.metadata.creationTime);
        const monthName = date.toLocaleString('default', { month: 'long' });
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        dateElement.innerText = `${monthName} ${day}, ${year}`;
    }

    // Handle password update
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;

    saveBtn.onclick = async function(event) {
        event.preventDefault();

        // Get form elements
        const form = document.getElementById('userInfo');
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('password');

        if (!form || !currentPasswordInput || !newPasswordInput) {
            console.error('Required form elements not found');
            return;
        }

        if(!form.checkValidity()){
            form.reportValidity();
            return;
        }

        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();

        // Validate inputs
        if (!currentPassword || !newPassword) {
            showModal('danger', 'Please fill in both password fields.');
            return;
        }

        if (newPassword.length < 6) {
            showModal('danger', 'New password must be at least 6 characters long.');
            return;
        }

        if (currentPassword === newPassword) {
            showModal('danger', 'New password must be different from current password.');
            return;
        }

        try {
            // Create credential and re-authenticate
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            
            // First try to re-authenticate
            await reauthenticateWithCredential(user, credential);
            
            // If re-authentication successful, update password
            await updatePassword(user, newPassword);
            const phoneDoc = doc(db, 'Admin', user.uid);
            await updateDoc(phoneDoc, {
                password: newPassword,
            });

            // Clear form
            currentPasswordInput.value = '';
            newPasswordInput.value = '';

            showModal('success2', 'Password successfully updated!');

        } catch (error) {
            console.error('Error updating password:', error);
            const errorMessage = getErrorMessage(error);
            showModal('danger', errorMessage);
            
            // Clear only the current password field on error
            currentPasswordInput.value = '';
        }
    }
});