import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, 
    doc, collection, query, limit,  Timestamp,
    onSnapshot, getDocs, addDoc, deleteDoc,
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
const auth = getAuth();
let userId = '';
onAuthStateChanged(auth, user => {
  userId = user.uid;
})
const driversCol = collection(db, "Passengers");

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
        data.blocked ? row.setAttribute('data-status', 'blocked') : row.setAttribute('data-status', 'active');
        (data.totalRating / data.ratingCount).toFixed(1) <= 1.9 ? row.setAttribute('class', 'table-danger') : '';
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col8 = document.createElement("td");
            const col9 = document.createElement("td");
    
            col1.innerHTML = `Passenger-${id.substring(0, 8)}`;
            col2.innerText = data.name;
            col3.innerText = data.phone_number ?? 'N/A';
            col4.innerText = data.email ?? 'N/A';
            col5.innerText = formatTimestampIntl(data.birthday);
            col6.innerText = (data.totalRating / data.ratingCount).toFixed(1);
            col8.innerHTML = data.blocked ? '<span class="badge bg-dark">Blocked</span>' : '<span class="badge bg-success">Active</span>';
            col9.innerHTML = `<button class="btn btn-success btn-sm viewMore" data-id="${id}">
              <i data-feather="eye"></i>
            </button>
            <button class="btn ${!data.blocked ? 'btn-dark' : 'btn-info'} btn-sm ${!data.blocked ? 'block' : 'unblock'}" data-id="${id}"  ${!data.blocked ? `data-bs-toggle="modal" data-bs-target="#warning2"` : ''}>
              <i data-feather="${!data.blocked ? 'slash' : 'thumbs-up'}"></i>
            </button>
            <button class="btn btn-danger btn-sm showModal" data-bs-toggle="modal" data-bs-target="#warning" data-id="${id}">
              <i data-feather="trash"></i>
            </button>`;
            
    
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col3);
            row.appendChild(col4);
            row.appendChild(col5);
            row.appendChild(col6);
            row.appendChild(col8);
            row.appendChild(col9);
            tablebody.appendChild(row);
    })
    feather.replace();
}
document.querySelector('table').addEventListener('click', async function(e) {
  const user = document.getElementById('User').innerText.substring(4);
  const targetButton = e.target.closest('button');
  if (e.target.classList.contains('viewMore')) {
    const itemId = e.target.getAttribute('data-id');
    console.log(itemId);
    window.location.href = `passengerIn.html?passenger=${itemId}#driver`;
  }else if (targetButton.classList.contains('block')) {
        const itemId = targetButton.getAttribute('data-id');
        document.getElementById('prompt2').innerText = `Are you sure you want to block Passenger-${itemId.substring(0,8)}?`;
        document.getElementById('block').setAttribute('data-id', itemId);
        console.log(itemId);
    }else if (targetButton.classList.contains('unblock')) {
      const itemId = targetButton.getAttribute('data-id');
      console.log(itemId);
      await updateDoc(doc(db, 'Passengers', itemId), {
          blocked: false
      });
      await addDoc(collection(db, 'AdminLogs'), {
        user_id: userId,
        category: 'Passengers List',
        action: `${user} unblocked Passenger-${itemId.substring(0, 8)}`,
        actionTime: Timestamp.now(),
    });
  }else if(targetButton.classList.contains('showModal')){
    const itemId = targetButton.getAttribute('data-id');
    document.getElementById('prompt').innerText = `Are you sure you want to delete Passenger-${itemId.substring(0,8)}?`;
    document.getElementById('delete').setAttribute('data-id', itemId);
  }
});
function formatTimestampIntl(timestamp) {
    const date = new Date(timestamp.toDate());
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  document.getElementById('delete').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
        const itemId = this.getAttribute('data-id');
        if(await checkDuplicate(itemId)){
          console.log('went here');
          document.getElementById('danger2').showModal();
          return;
        }
        console.log(itemId);
        await deleteDoc(doc(db, 'Passengers', itemId)).then(() => {
          document.getElementById('success2').showModal();
        });
        await addDoc(collection(db, 'AdminLogs'), {
          user_id: userId,
          category: 'Drivers List',
          action: `${user} deleted Driver-${itemId.substring(0, 8)}`,
          actionTime: Timestamp.now(),
      });
  }
  document.getElementById('block').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    const itemId = this.getAttribute('data-id');
    const reason = document.getElementById('reason').value;
    await updateDoc(doc(db, 'Passengers', itemId), {
      blocked: true,
      reason: reason
    });
    document.getElementById('reason').value = '';
    await addDoc(collection(db, 'AdminLogs'), {
      user_id: userId,
      category: 'Passengers List',
      action: `${user} blocked Passenger-${itemId.substring(0, 8)} reason: ${reason}`,
      actionTime: Timestamp.now(),
    });
  }
  
  async function checkDuplicate(id){
    const queryResult = query(collection(db, 'Trips'), where('passenger.passenger_id', '==', id), limit(1));
    const result = await getDocs(queryResult);
    if(!result.empty){
      return true;
    }else{
      return false;
    }
  }