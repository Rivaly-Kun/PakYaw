import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, 
    doc, collection, query, limit, 
    onSnapshot, getDocs, orderBy, addDoc, Timestamp,
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
const driversCol = query(collection(db, 'Notifications'), orderBy('createdAt', 'desc'));
const auth = getAuth();
let userId = '';
onAuthStateChanged(auth, user => {
  userId = user.uid;
})
const documents = new Map();
getDocs(driversCol).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      documents.set(doc.id, doc.data());
    });
    console.log(querySnapshot.size);
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

    function formatTimestampIntl(timestamp) {
        const date = new Date(timestamp.toDate());
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }

function renderTable(){
    const tablebody = document.querySelector("#table1 tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const row = document.createElement("tr");
        row.setAttribute('data-status', data.resolved);
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
    
            col1.innerHTML = `Ticket-${id.substring(0, 8)}`;
            col2.innerText = `User-${data.user_id.substring(0, 8)}`;
            col3.innerText = data.message;
            col4.innerText = formatTimestampIntl(data.createdAt);
            col5.innerHTML = data.resolved ? '<span class="badge bg-success">Resolved</span>' : `<button class="btn btn-warning btn-sm statusChange" data-id="${id}">Resolve</button>`;
            
    
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col3);
            row.appendChild(col4);
            row.appendChild(col5);
            tablebody.appendChild(row);
    })
}

document.querySelector('table').addEventListener('click', async function(e) {
  console.log('clicked');
  const user = document.getElementById('User').innerText.substring(4);
  if (e.target.classList.contains('statusChange')) {
    const itemId = e.target.getAttribute('data-id');
    const driverDocRef = doc(db, 'Notifications', itemId);
    const itemData = documents.get(itemId);
    const val = itemData.status;
    await updateDoc(driverDocRef, {
        resolved: true,
    });
    await addDoc(collection(db, 'AdminLogs'), {
      user_id: userId,
      category: 'Notifications Ticket',
      action: `${user} resolved Ticket-${itemId.substring(0, 8)}`,
      actionTime: Timestamp.now(),
  });
  }
});