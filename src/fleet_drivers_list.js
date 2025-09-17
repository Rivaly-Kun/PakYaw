import { initializeApp } from "firebase/app"
import { getFirestore, 
    doc, collection, query, limit, 
    onSnapshot, getDocs, getDoc,
    where,
    updateDoc} from "firebase/firestore"

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

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const userId = urlParams.get('fleetOwnerUserId');

getDriver(userId);

const driverVehiclesCol = collection(db, 'Vehicle');
const q = query(driverVehiclesCol, where('fleet.fleet_id', '==', userId));

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

const driversCol = query(collection(db, "Driver"), where('fleet_id', '==', userId));
async function getStatus(docID){
    const driverDocRef = doc(db, 'Driver', docID);
    const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    let listStatus = [];
    let val = false;
    const snapshot = await getDocs(docRef);
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
    console.log(val);
    return val;

}

const documents = new Map();

getDocs(driversCol).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      documents.set(doc.id, doc.data());
    });
    renderTable();
  });

    onSnapshot(driversCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
                documents.set(change.doc.id, change.doc.data());
              } else if (change.type === "removed") {
                documents.delete(change.doc.id);
              }
        })
        renderTable();
    })

function renderTable(){
    const tablebody = document.querySelector("#table1 tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const row = document.createElement("tr");
            getStatus(id) ? row.setAttribute("data-status", 'active') :  row.setAttribute("data-status", 'inactive');
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col7 = document.createElement("td");
    
            col1.innerHTML = `Driver-${id.substring(0, 8)}`;
            col2.innerText = data.name;
            col3.innerText = data.phone_number ?? 'N/A';
            col4.innerText = data.email ?? 'N/A';
            col5.innerText = data.rating.toFixed(1);
            col6.innerHTML = getStatus(id) ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>';
            col7.innerHTML = `<button class="btn btn-success btn-sm viewMore" style="margin-right: 5px" data-id="${id}"><i data-feather="eye"></i></button><button class="btn ${!data.blocked ? 'btn-dark' : 'btn-info'} btn-sm ${!data.blocked ? 'block' : 'unblock'}" data-id="${id}" ${!data.blocked ? `data-bs-toggle="modal" data-bs-target="#warning2"` : ''}><i data-feather="${!data.blocked ? 'slash' : 'thumbs-up'}"></i></button>`;
            
    
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col3);
            row.appendChild(col4);
            row.appendChild(col5);
            row.appendChild(col6);
            row.appendChild(col7);
            tablebody.appendChild(row);
    })
    feather.replace();
}
document.querySelector('table').addEventListener('click', function(e) {
    if (e.target.classList.contains('viewMore')) {
        const itemId = e.target.getAttribute('data-id');
        console.log(itemId);
        window.location.href = `driversIn.html?driverUserId=${itemId}#driver`;
    }
});
document.querySelector('table').addEventListener('click', async function(e) {
    const user = document.getElementById('User').innerText.substring(4);
    if (e.target.classList.contains('block')) {
        const itemId = e.target.getAttribute('data-id');
        document.getElementById('prompt2').innerText = `Are you sure you want to delete Driver-${itemId.substring(0,8)}?`;
        document.getElementById('block').setAttribute('data-id', itemId);
    }else if (e.target.classList.contains('unblock')) {
        const itemId = e.target.getAttribute('data-id');
        console.log(itemId);
        await updateDoc(doc(db, 'Driver', itemId), {
            blocked: false
        });
        await addDoc(collection(db, 'AdminLogs'), {
            user_id: userId,
            category: 'Drivers List',
            action: `${user} unblocked Driver-${itemId.substring(0, 8)}`,
            actionTime: Timestamp.now(),
        });
    }
});
document.getElementById('block').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
        const itemId = this.getAttribute('data-id');
        await updateDoc(doc(db, 'Driver', itemId), {
            blocked: true
        });
        await addDoc(collection(db, 'AdminLogs'), {
            user_id: userId,
            category: 'Drivers List',
            action: `${user} blocked Driver-${itemId.substring(0, 8)}`,
            actionTime: Timestamp.now(),
        });
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