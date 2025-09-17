import { initializeApp } from "firebase/app"
import { getFirestore, 
    getDocs, getDoc, doc, collection, query, limit, 
    onSnapshot, updateDoc } from "firebase/firestore"
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
onAuthStateChanged(auth, user => {
    adminId = user.uid;
});
let fleetDocsReq = {};
const driverReqCol = collection(db, 'FleetDocumentRequirements');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const userId = urlParams.get('fleetOwnerUserId');
onSnapshot(driverReqCol, (snapshot) => {
  snapshot.forEach((entry) => {
    fleetDocsReq[entry.id] = entry.data().Businesses;
  });
  console.log(fleetDocsReq);
  getDriver(userId)
});
let companyName = '';

function getDriver(load){
    const driverDocRef = doc(db, 'FleetOwner', load);
    onSnapshot(driverDocRef, (doc) => {
        companyName = doc.get('company');
        console.log(doc.get('company'));
        document.getElementById('Company').innerText = `Company: ${doc.get('company') == '' ? 'N/A' : doc.get('company')}`;
        document.getElementById('FleetOwnername').innerText = `Name: ${doc.get('name')}`;
        document.getElementById('Contact').innerText = `Contact: ${doc.get('phone_number') ?? 'N/A'}`;
        document.getElementById('Email').innerText = `Email: ${doc.get('email') ?? 'N/A'}`;
        document.getElementById('profile_pic').innerHTML = `<img src=${doc.get('profile_pic') == '' ? "https://via.placeholder.com/40" : doc.get('profile_pic')} alt="Dale" width="100" height="100"><h4 id="Rating">${doc.get('rating')}</h4><h6 id="Rating">${ratingSummary(doc.get('rating'))}`;
        document.getElementById('Status').innerHTML = `Status: ${doc.get('onlineStatus') ? '<span class="badge bg-success">Online</span>' : '<span class="badge bg-danger">Offline</span>'}`;

    })  
    const driversDocumentsRef = collection(driverDocRef, 'FleetOwnerDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    console.log(companyName);
    onSnapshot(docRef, (snapshot) => {
        snapshot.forEach((doc) => {
            renderTable(doc, companyName);
        })
    });
}

function renderTable(data, companyName){
    const container = document.getElementById('driverRequirements');
    container.innerHTML = '';
    for(let x in fleetDocsReq){
        const item = document.createElement('div');
        if(fleetDocsReq[x] && companyName!='' && data.data()[`${x}`] != undefined){
            item.innerHTML = `<div class="card card3" style="width: fit-content;">
                                        <div class="card-header  d-flex justify-content-between align-items-center">
                                            <div class="d-flex">
                                                <h4>${x}</h4>
                                            </div>
                                        </div>
                                        <div class="card-body" style="width: fit-content;" id="${x}">
                                            ${isImageOrPdf(data.data()[`${x}`].URL) == 'Image' ? `
                                                <div class="card" style="margin-bottom: 22px; height: 272px; width: 200px;">
                                                    <img src=${data.data()[`${x}`].URL == '' ? "https://via.placeholder.com/40" : data.data()[`${x}`].URL} alt="driverLicensePic" width="200" height="270">
                                                </div>` : 
                                                `<div style="margin-bottom: 22px; width:200px; height:272px">
                                                    ${data.data()[`${x}`].URL != '' ? `<a href="${data.data()[`${x}`].URL}" target="_blank" download>View or Download ${x}.pdf</a>` : 
                                                    '<p>Fleet Owner Has not submitted this document.</p>'}
                                                    
                                                </div>`
                                            }
                                            ${data.data()[`${x}`].Verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>'}
                                            <br><br>
                                            <div style="height: 100px">
                                                ${data.data()[`${x}`].Identification != null ? `<p>Identification: ${data.data()[`${x}`].Identification}</p>` : ''}
                                                ${data.data()[`${x}`].IssuanceDate != null ? `<p>Issuance date: ${formatTimestampIntl(data.data()[`${x}`].IssuanceDate)}</p>`: ''}
                                                ${data.data()[`${x}`].ExpiryDate != null ? `<p>Issuance date: ${formatTimestampIntl(data.data()[`${x}`].ExpiryDate)}</p>` : ''} 
                                            </div>
                                            ${!data.data()[`${x}`].Verified ? `<button class="btn btn-primary verify" data-id="${x}">Verify</button>` : ''}             
                                        </div>
                                    </div>`;
                                    container.appendChild(item);
        }else if(!fleetDocsReq[x] && companyName=='' && data.data()[`${x}`] != undefined){
            item.innerHTML = `<div class="card card3" style="width: fit-content;">
                                        <div class="card-header  d-flex justify-content-between align-items-center">
                                            <div class="d-flex">
                                                <h4>${x}</h4>
                                            </div>
                                        </div>
                                        <div class="card-body" style="width: fit-content;" id="${x}">
                                            ${isImageOrPdf(data.data()[`${x}`].URL) == 'Image' ? `
                                                <div class="card" style="margin-bottom: 22px; height: 272px; width: 200px;">
                                                    <img src=${data.data()[`${x}`].URL == '' ? "https://via.placeholder.com/40" : data.data()[`${x}`].URL} alt="driverLicensePic" width="200" height="270">
                                                </div>` : 
                                                `<div style="margin-bottom: 22px; width:200px; height:272px">
                                                    ${data.data()[`${x}`].URL != '' ? `<a href="${data.data()[`${x}`].URL}" target="_blank" download>View or Download ${x}.pdf</a>` : 
                                                    '<p>Fleet Owner Has not submitted this document.</p>'}
                                                    
                                                </div>`
                                            }
                                            ${data.data()[`${x}`].Verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>'}
                                            <br><br>
                                            <div style="height: 100px">
                                                ${data.data()[`${x}`].Identification != null ? `<p>Identification: ${data.data()[`${x}`].Identification}</p>` : ''}
                                                ${data.data()[`${x}`].IssuanceDate != null ? `<p>Issuance date: ${formatTimestampIntl(data.data()[`${x}`].IssuanceDate)}</p>`: ''}
                                                ${data.data()[`${x}`].ExpiryDate != null ? `<p>Issuance date: ${formatTimestampIntl(data.data()[`${x}`].ExpiryDate)}</p>` : ''} 
                                            </div>
                                            ${!data.data()[`${x}`].Verified ? `<button class="btn ${data.data()[`${x}`].URL != '' ? 'btn-primary verify' : 'btn-light'}" data-id="${x}">Verify</button>` : ''}           
                                        </div>
                                    </div>`;
                                    container.appendChild(item);
        }
        if(!fleetDocsReq[x] && companyName=='' && data.data()[`${x}`] == undefined){
            item.innerHTML = `<div class="card card3" style="width: fit-content;">
                                        <div class="card-header  d-flex justify-content-between align-items-center">
                                            <div class="d-flex">
                                                <h4>${x}</h4>
                                            </div>
                                        </div>
                                        <div class="card-body" style="width: fit-content;" id="${x}">
                                            <div style="margin-bottom: 22px; width:200px; height:272px">
                                                <p>Fleet Owner Has not submitted this document.</p>   
                                            </div>
                                            <span class="badge bg-danger">Unverified</span>
                                            <br><br>
                                            <div style="height: 100px"> 
                                            </div>
                                            <button class="btn btn-light" data-id="${x}">Verify</button>             
                                        </div>
                                    </div>`;
                                    container.appendChild(item);
        }
        if(fleetDocsReq[x] && companyName!='' && data.data()[`${x}`] == undefined){
            item.innerHTML = `<div class="card card3" style="width: fit-content;">
                                        <div class="card-header  d-flex justify-content-between align-items-center">
                                            <div class="d-flex">
                                                <h4>${x}</h4>
                                            </div>
                                        </div>
                                        <div class="card-body" style="width: fit-content;" id="${x}">
                                            <div style="margin-bottom: 22px; width:200px; height:272px">
                                                <p>Fleet Owner Has not submitted this document.</p>   
                                            </div>
                                            <span class="badge bg-danger">Unverified</span>
                                            <br><br>
                                            <div style="height: 100px"> 
                                            </div>
                                            <button class="btn btn-light" data-id="${x}">Verify</button>             
                                        </div>
                                    </div>`;
                                    container.appendChild(item);
        }

    }
    feather.replace();

    document.querySelector('#driverRequirements').addEventListener('click', async function(e){
        if(e.target.classList.contains('verify')){
            const req = e.target.getAttribute('data-id');
            const driverDocRef = doc(db, 'FleetOwner', userId);
            const driversDocumentsRef = collection(driverDocRef, 'FleetOwnerDocuments');
            const docRef = query(driversDocumentsRef, limit(1));
            const querySnapshot = await getDocs(docRef);
            const docToUpdate = querySnapshot.docs[0].ref; 
            await updateDoc(docToUpdate, {
                [`${req}.Verified`]:true
            }).then(async () => {
                await addDoc(collection(db, 'AdminLogs'), {
                    user_id: adminId,
                    category: 'Fleet Owners Information',
                    action: `User-${adminId.substring(0,8)} Verified ${req} of FleetOwner-${userId.substring(0, 8)}`,
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

// document.getElementById('verifyFirstDoc').onclick = async function(event) {
//     event.preventDefault();
//     const driverDocRef = doc(db, 'FleetOwner', userId);
//     const driversDocumentsRef = collection(driverDocRef, 'FleetOwnerDocuments');
//     const docRef = query(driversDocumentsRef, limit(1));
//     const querySnapshot = await getDocs(docRef);
//     const docToUpdate = querySnapshot.docs[0].ref; 
//     if(companyName == ''){
//         await updateDoc(docToUpdate, {
//             driverLicenseVerified: true
//         })
//     }else{
//         await updateDoc(docToUpdate, {
//             birVerified: true
//         })
//     }
    
// }
// document.getElementById('verifySecondDoc').onclick = async function(event) {
//     event.preventDefault();
//     const driverDocRef = doc(db, 'FleetOwner', userId);
//     const driversDocumentsRef = collection(driverDocRef, 'FleetOwnerDocuments');
//     const docRef = query(driversDocumentsRef, limit(1));
//     const querySnapshot = await getDocs(docRef);
//     const docToUpdate = querySnapshot.docs[0].ref; 
//     if(companyName == ''){
//         await updateDoc(docToUpdate, {
//             proofOfCitizenshipVerified: true
//         })
//     }else{
//         await updateDoc(docToUpdate, {
//             dtiVerified: true
//         })
//     }
    
// }
// document.getElementById('verifyThirdDoc').onclick = async function(event) {
//     event.preventDefault();
//     const driverDocRef = doc(db, 'FleetOwner', userId);
//     const driversDocumentsRef = collection(driverDocRef, 'FleetOwnerDocuments');
//     const docRef = query(driversDocumentsRef, limit(1));
//     const querySnapshot = await getDocs(docRef);
//     const docToUpdate = querySnapshot.docs[0].ref; 
//     if(companyName == ''){
//         await updateDoc(docToUpdate, {
//             nbiClearanceVerified: true
//         })
//     }else{
//         await updateDoc(docToUpdate, {
//             permitVerified: true
//         })
//     }
    
// }

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

document.getElementById('fleetDocsButton').onclick = function(event){
    event.preventDefault();
    window.location.href = `fleetOwnerIn.html?fleetOwnerUserId=${userId}#fleetOwner`;
}

document.getElementById('vehiclesButton').onclick = function(event){
    event.preventDefault();
    window.location.href = `fleetOwnerVehicleT.html?fleetOwnerUserId=${userId}#fleetOwner`;
}
document.getElementById('driversListButton').onclick = function(event){
    event.preventDefault();
    window.location.href = `fleetOwnersDrivers.html?fleetOwnerUserId=${userId}#fleetOwner`;
}

function formatTimestampIntl(timestamp) {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US').format(date);
  }