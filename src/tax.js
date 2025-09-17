import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
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
let userId = '';
onAuthStateChanged(auth, user => {
    userId = user.uid;
})
const db = getFirestore(app);
const taxCol = collection(db, 'PakyawSettings');

const taxDoc = doc(db, 'PakyawSettings', 'Tax');

onSnapshot(taxDoc, (snaphot) => {
    document.getElementById('vatTax').value = (snaphot.get('vat_tax') * 100);
    document.getElementById('cpcTax').value = (snaphot.get('common_carrier_tax') * 100);
})

document.getElementById('updateCPCTax').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let value = document.getElementById('cpcTax').value;
    const formCPC = document.getElementById('cpcTaxForm');
    if(!formCPC.checkValidity()){
        formCPC.reportValidity();
    }else{
        await updateDoc(taxDoc, {
            common_carrier_tax: value / 100
        }).then(async () => {
            await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: `Common Carrier's Tax`,
                action: `${user} updated Common Carrier's Tax to ${value}.`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success').showModal();
        }).catch(() => {
            document.getElementById('danger').showModal();
        });
    }
}

document.getElementById('updateVatTax').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let value = document.getElementById('vatTax').value;
    const formVat = document.getElementById('vatTaxForm');
    console.log(!formVat.checkValidity());
    if(!formVat.checkValidity()){
        formVat.reportValidity();
    }else{
        await updateDoc(taxDoc, {
            vat_tax: value / 100
        }).then(async () => {
            await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Vat Tax',
                action: `${user} updated Vat Tax to ${value}.`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success').showModal();
        }).catch(() => {
            document.getElementById('danger').showModal();
        });
    }
    
}