import { initializeApp } from "firebase/app"
import { 
    getFirestore,
    collection, 
    query, 
    where, 
    getCountFromServer,
    Timestamp,
    onSnapshot,
    getDocs,
    doc 
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const discountCol = query(collection(db, 'Trips'), where('status', '==', 'ongoing'));

const documents = new Map();

getDocs(discountCol).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        documents.set(doc.id, doc.data());
    });
    renderTable();
  });
onSnapshot(discountCol, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added" || change.type === "modified") {
        documents.set(change.doc.id, change.doc.data());
    } else if (change.type === "removed") {
        documents.delete(change.doc.id);
    }
  })
  renderTable();
});

function renderTable(){
    const tablebody = document.querySelector("#ongoingRidesTable tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const date = new Date(data.createdTime.toDate());
        const day = String(date.getMinutes()).padStart(2, '0');
        const month = String(date.getHours())
        const hour12 = month % 12 || 12;
        const amOrpm = month >= 12 ? 'PM' : 'AM';
        let discountedFare = data.fare - (data.fare * data.promo.discount);
        let vatTax = discountedFare * data.vatTax;
        let cpcTax = discountedFare * data.ccTax;
        discountedFare = discountedFare + vatTax + cpcTax;
        const row = document.createElement("tr");
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col7 = document.createElement("td");
    
            col1.innerText = "Trip-" + id.substring(0, 8);
            col2.innerText = data.driver.driver_name;
            col3.innerText = data.passenger.passenger_name;
            col4.innerText = data.changedDropOffAddress != '' ? data.changedDropOffAddress : data.dropOffAddress;
            col5.innerText = `${String(hour12).padStart(2, '0')}:${day} ${amOrpm}`;
            col6.innerText = '₱' + ' ' + discountedFare;
            col7.innerHTML = `<button type="button" class="btn btn-success viewMore" data-id="${id}"><i data-feather="eye"></i></button>`;
            
    
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
        window.location.href = `../../trip.html?tripId=${itemId}#trip`;
    }
});