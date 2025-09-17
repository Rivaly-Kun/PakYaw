import { initializeApp } from "firebase/app"
import {
    getAuth,
    onAuthStateChanged
} from "firebase/auth"
import { getFirestore, 
    doc, collection, query, limit, 
    onSnapshot, getDocs, addDoc, updateDoc, where, getDoc, setDoc,
    Timestamp,
    deleteDoc} from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyA6_3d88atEhHcUA0UjDsLxzZ0pEhJgA9c",
    authDomain: "ride-hailing-app-68e81.firebaseapp.com",
    projectId: "ride-hailing-app-68e81",
    storageBucket: "ride-hailing-app-68e81.appspot.com",
    messagingSenderId: "704173359839",
    appId: "1:704173359839:web:84bc81ebbc2253b8fb5f6a",
    measurementId: "G-SGV6EXYW9M"
  };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let userId = '';
onAuthStateChanged(auth, user => {
    userId = user.uid;
});
const chargeDoc = doc(db, 'PakyawSettings', 'Charge');
const baseKmDoc = doc(db, 'PakyawSettings', 'Base_KM');
const phoneDoc = doc(db, 'PakyawSettings', 'EmergencyCall');

onSnapshot(chargeDoc, (snaphot) => {
    document.getElementById('charge').value = snaphot.get('cancellation_charge');
})
onSnapshot(baseKmDoc, (snaphot) => {
    document.getElementById('baseKm').value = snaphot.get('base_km');
})
onSnapshot(phoneDoc, (snaphot) => {
    document.getElementById('phoneNumber').value = snaphot.get('phone_number');
})

onSnapshot(chargeDoc, (snaphot) => {
    document.getElementById('appCharge').value = snaphot.get('app_charge') * 100;
})
document.getElementById('updateCharge').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let value = document.getElementById('charge').value;
    const formCharge = document.getElementById('chargeForm');
    if(!formCharge.checkValidity()){
        formCharge.reportValidity();
    }else{
        await updateDoc(chargeDoc, {
            cancellation_charge: parseFloat(value)
        }).then(async () => {
            await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Cancellation Charge',
                action: `${user} updated Cancellation Charge to ${value}.`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success').showModal();
        }).catch(() => {
            document.getElementById('danger').showModal();
        });
    }
}

document.getElementById('updateBaseKm').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let value = document.getElementById('baseKm').value;
    const formBaseKm = document.getElementById('baseKmForm');
    if(!formBaseKm.checkValidity()){
        formBaseKm.reportValidity();
    }else{
        await updateDoc(baseKmDoc, {
            base_km: parseFloat(value) 
        }).then(async () => {
            await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Base Km',
                action: `${user} updated Base Kilometer to ${value}.`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success').showModal();
        }).catch(() => {
            document.getElementById('danger').showModal();
        });
    }
}

document.getElementById('updatePhone').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let value = document.getElementById('phoneNumber').value;
    const formBaseKm = document.getElementById('phoneForm');
    if(!formBaseKm.checkValidity()){
        formBaseKm.reportValidity();
    }else{
        await updateDoc(phoneDoc, {
            phone_number: value  
        }).then(async () => {
            await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Emergency Phone number',
                action: `${user} updated Emergency Phone number to ${value}.`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success').showModal();
        }).catch(() => {
            document.getElementById('danger').showModal();
        });
    }
}

document.getElementById('updateAppCharge').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let value = document.getElementById('appCharge').value;
    const formBaseKm = document.getElementById('appChargeForm');
    if(!formBaseKm.checkValidity()){
        formBaseKm.reportValidity();
    }else{
        await updateDoc(chargeDoc, {
            app_charge: parseFloat(value) / 100  
        }).then(async () => {
            await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Appplication Charge',
                action: `${user} updated Application Charge number to ${value}.`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success').showModal();
        }).catch(() => {
            document.getElementById('danger').showModal();
        });
    }
}