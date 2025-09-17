import { initializeApp } from "firebase/app"
import { getFirestore, 
    getDocs, getDoc, doc, collection, query, limit, 
    onSnapshot, updateDoc, addDoc, Timestamp } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from 'firebase/auth'


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
let adminId = '';
const array = ['Student', 'PWD', 'Senior Citizen'];
onAuthStateChanged(auth, user => {
    adminId = user.uid;
});
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const userId = urlParams.get('passenger');
getDriver(userId);

function getDriver(load){
    const driverDocRef = doc(db, 'Passengers', load);
    onSnapshot(driverDocRef, (doc) => {

        document.getElementById('Passengername').innerText = `Name: ${doc.get('name') ?? 'N/A'}`;
        document.getElementById('Contact').innerText = `Contact: ${doc.get('phone_number') ?? 'N/A'}`;
        document.getElementById('Email').innerText = `Email: ${doc.get('email') ?? 'N/A'}`;
        document.getElementById('profile_pic').innerHTML = `<img src=${doc.get('profile_pic') == '' ? "https://via.placeholder.com/40" : doc.get('profile_pic')} alt="Dale" width="100" height="100"><br><br><h4 id="Rating">${(doc.get('totalRating') / doc.get('ratingCount')).toFixed(1)}</h4><h6 id="Rating">${ratingSummary(doc.get('rating'))}`;
        document.getElementById('Birthday').innerHTML = `Birthday: ${formatTimestampIntl(doc.get('birthday'))}`;

        renderTable(doc);
    })
    
}

function renderTable(data){
    const container = document.getElementById('driverRequirements');
    container.innerHTML = '';
    for(let i = 0; i < 3; i++){
        const item = document.createElement('div');
        if(data.data()[`${array[i]}`] != undefined){
            item.innerHTML = `<div class="card card3" style="width: fit-content;">
                                    <div class="card-header  d-flex justify-content-between align-items-center">
                                        <div class="d-flex">
                                            <h4>${array[i]}</h4>
                                        </div>
                                    </div>
                                    <div class="card-body" style="width: fit-content;" id="${array[i]}">
                                        ${isImageOrPdf(data.data()[`${array[i]}`].url) == 'Image' ? `
                                            <div class="card" style="margin-bottom: 22px; height: 272px; width: 200px;">
                                                <img src=${data.data()[`${array[i]}`].url == '' ? "https://via.placeholder.com/40" : data.data()[`${array[i]}`].url} alt="driverLicensePic" width="200" height="270">
                                            </div>` : 
                                            `<div style="margin-bottom: 22px; width:200px; height:272px">
                                                    ${data.data()[`${array[i]}`].url != '' ? `<a href="${data.data()[`${array[i]}`].url}" target="_blank" download>View or Download ${array[i]}.pdf</a>` : 
                                                    '<p>Fleet Owner Has not submitted this document.</p>'}
                                                    
                                                </div>`
                                        }
                                        ${data.data()[`${array[i]}`].verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>'}
                                        <br><br>
                                        ${!data.data()[`${array[i]}`].verified ? `<button class="btn ${data.data()[`${array[i]}`].url != '' ? 'btn-primary verify' : 'btn-light'}" data-id="${array[i]}">Verify</button>` : ''}             
                                    </div>
                                </div>`;
                                container.appendChild(item);
        }
    }
    feather.replace();

    document.querySelector('#driverRequirements').addEventListener('click', async function(e){
        if(e.target.classList.contains('verify')){
            const req = e.target.getAttribute('data-id');
            const driverDocRef = doc(db, 'Passengers', userId);
            await updateDoc(driverDocRef, {
                [`${req}.verified`]:true
            }).then(async () => {
                await addDoc(collection(db, 'AdminLogs'), {
                    user_id: adminId,
                    category: 'Passengers Information',
                    action: `User-${adminId.substring(0,8)} Verified ${req} of Passenger-${userId.substring(0, 8)}`,
                    actionTime: Timestamp.now(),
                });
            })
        }
    })

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

function isImageOrPdf(url) {
    // Extract the file extension
    const fileExtension = url.split('.').pop().split('?')[0].toLowerCase();

    // Define image and PDF extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const pdfExtension = 'pdf';

    // Check if the file is an image
    if (imageExtensions.includes(fileExtension)) {
        return 'Image';
    }
    // Check if the file is a PDF
    else if (fileExtension === pdfExtension) {
        return 'PDF';
    } 
    // If the file is neither, return unknown
    else {
        return 'Unknown';
    }
}

// document.getElementById('verifyDriverLicense').onclick = async function(event) {
//     event.preventDefault();
//     const driverDocRef = doc(db, 'Driver', userId);
//     const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
//     const docRef = query(driversDocumentsRef, limit(1));
//     const querySnapshot = await getDocs(docRef);
//     const docToUpdate = querySnapshot.docs[0].ref; 
//     await updateDoc(docToUpdate, {
//         driverLicenseVerified: true
//     })
// }
// document.getElementById('verifyPOC').onclick = async function(event) {
//     event.preventDefault();
//     const driverDocRef = doc(db, 'Driver', userId);
//     const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
//     const docRef = query(driversDocumentsRef, limit(1));
//     const querySnapshot = await getDocs(docRef);
//     const docToUpdate = querySnapshot.docs[0].ref; 
//     await updateDoc(docToUpdate, {
//         proofOfCitizenshipVerified: true
//     })
// }
// document.getElementById('verifyNBI').onclick = async function(event) {
//     event.preventDefault();
//     const driverDocRef = doc(db, 'Driver', userId);
//     const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
//     const docRef = query(driversDocumentsRef, limit(1));
//     const querySnapshot = await getDocs(docRef);
//     const docToUpdate = querySnapshot.docs[0].ref; 
//     await updateDoc(docToUpdate, {
//         nbiClearanceVerified: true
//     })
// }

function formatTimestampIntl(timestamp) {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US').format(date);
  }