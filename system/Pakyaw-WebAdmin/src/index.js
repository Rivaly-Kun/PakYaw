import { initializeApp } from "firebase/app"
import { getFirestore, 
    getDocs, getDoc, doc, collection, query, limit, 
    onSnapshot, updateDoc } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyBIyUbQitpmfFPwOXujC2oHS0NAU1XJjGs",
    authDomain: "ride-hailing-app-68e81.firebaseapp.com",
    projectId: "ride-hailing-app-68e81",
    storageBucket: "ride-hailing-app-68e81.appspot.com",
    messagingSenderId: "704173359839",
    appId: "1:704173359839:web:5a5c0ad1519ef800fb5f6a",
    measurementId: "G-50Q1H0L38G"
  };

initializeApp(firebaseConfig);

const db = getFirestore();
const driversCol = collection(db, "Driver");
async function getStatus(docID){
    const driverDocRef = doc(db, 'Driver', docID);
    const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    let listStatus = [];
    let val = false;
    onSnapshot(docRef, (snapshot) => {
        snapshot.forEach((doc) => {
            listStatus[0] = doc.get('driverLicenseVerified');
            listStatus[1] = doc.get('proofOfCitizenshipVerified');
            listStatus[2] = doc.get('nbiClearanceVerified');
        })
        console.log(listStatus);
        console.log(listStatus[0]);
        console.log(listStatus[1]);
        console.log(listStatus[2]);
        if(listStatus[0] && listStatus[1] && listStatus[2]){
            console.log(true);
            val = true;
        }else{
            console.log(false);
            val = false;
        }
    });
    console.log(val);
    return val;

}
console.log("WORking");
    onSnapshot(driversCol, (snapshot) => {
        var tablebody = document.querySelector("#table1 tbody");
        snapshot.forEach((doc) => {
            var row = document.createElement("tr");
            getStatus(doc.id) ? row.setAttribute("data-status", 'active') :  row.setAttribute("data-status", 'inactive');
            var col1 = document.createElement("td");
            var col2 = document.createElement("td");
            var col3 = document.createElement("td");
            var col4 = document.createElement("td");
            var col5 = document.createElement("td");
            var col6 = document.createElement("td");
    
            col1.innerHTML = `<img src=${doc.get('profile_pic') == '' ? "https://via.placeholder.com/40" : doc.get('profile_pic')} alt="User ID" class="img-circle"><a href="driversIn.html?userId=${doc.id}">${doc.id}</a>`;
            col2.innerText = doc.get('name');
            col3.innerText = doc.get('phone_number') ?? 'N/A';
            col4.innerText = doc.get('email') ?? 'N/A';
            col5.innerText = doc.get('rating');
            col6.innerHTML = getStatus(doc.id) ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>';
            
    
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col3);
            row.appendChild(col4);
            row.appendChild(col5);
            row.appendChild(col6);
            tablebody.appendChild(row);
        })
    })



function getDriver(load){
    const driverDocRef = doc(db, 'Driver', load);
    getDoc(driverDocRef).then((doc) => {

        document.getElementById('Drivername').innerText = `Name: ${doc.get('name')}`;
        document.getElementById('Contact').innerText = `Contact: ${doc.get('phone_number') ?? 'N/A'}`;
        document.getElementById('Email').innerText = `Email: ${doc.get('email') ?? 'N/A'}`;
        document.getElementById('profile_pic').innerHTML = `<img src=${doc.get('profile_pic') == '' ? "https://via.placeholder.com/40" : doc.get('profile_pic')} alt="Dale" width="100" height="100"><br><br><h4 id="Rating">${doc.get('rating')}</h4><h6 id="Rating">${ratingSummary(doc.get('rating'))}`;
        document.getElementById('Status').innerHTML = `Status: ${doc.get('onlineStatus') ? '<span class="badge bg-success">Online</span>' : '<span class="badge bg-danger">Offline</span>'}`;

        
    })
    const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    onSnapshot(docRef, (snapshot) => {
        snapshot.forEach((doc) => {
            console.log('POC URL:', doc.get('proofOfCitizenshipURL'));
            console.log('NBI URL:', doc.get('nbiClearanceURL'));
            document.getElementById('driversLicenseUrl').innerHTML = `<img src=${doc.get('driverLicenseURL') == '' ? "https://via.placeholder.com/40" : doc.get('driverLicenseURL')} alt="driverLicensePic" width="200" height="270">`;
            document.getElementById('licenseNum').innerText = doc.get('driverLicenseNumber');
            document.getElementById('expiryDate').innerText = doc.get('driverExpiryDate');

            document.getElementById('pocUrl').innerHTML = `<img src=${doc.get('proofOfCitizenshipURL') == '' ? "https://via.placeholder.com/40" : doc.get('proofOfCitizenshipURL')} alt="Proof of Citizenship" width="200" height="270">`;
            document.getElementById('nbiUrl').innerHTML = `<img src=${doc.get('nbiClearanceURL') == '' ? "https://via.placeholder.com/40" : doc.get('nbiClearanceURL')} alt="NBI Clearance" width="200" height="270">`;
        })
    });
    console.log(docRef);
}

function ratingSummary(rating){
    if(rating < 1){
        return 'Bad';
    }
    if(rating < 2){
        return 'Subpar';
    }
    if(rating < 3){
        return 'Okay';
    }
    if(rating < 4){
        return 'Good';
    }
    if(rating <= 5){
        return 'Amazing';
    }

}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const userId = urlParams.get('userId');
getDriver(userId)

document.getElementById('verifyDriverLicense').onclick = async function(event) {
    event.preventDefault();
    const driverDocRef = doc(db, 'Driver', userId);
    const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    const querySnapshot = await getDocs(docRef);
    const docToUpdate = querySnapshot.docs[0].ref; 
    await updateDoc(docToUpdate, {
        driverLicenseVerified: true
    })
}
document.getElementById('verifyPOC').onclick = async function(event) {
    event.preventDefault();
    const driverDocRef = doc(db, 'Driver', userId);
    const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    const querySnapshot = await getDocs(docRef);
    const docToUpdate = querySnapshot.docs[0].ref; 
    await updateDoc(docToUpdate, {
        proofOfCitizenshipVerified: true
    })
}
document.getElementById('verifyNBI').onclick = async function(event) {
    event.preventDefault();
    const driverDocRef = doc(db, 'Driver', userId);
    const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    const querySnapshot = await getDocs(docRef);
    const docToUpdate = querySnapshot.docs[0].ref; 
    await updateDoc(docToUpdate, {
        nbiClearanceVerified: true
    })
}


