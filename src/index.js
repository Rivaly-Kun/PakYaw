import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, 
    doc, collection, query, limit, 
    onSnapshot, getDocs, orderBy, deleteDoc,
    where,
    updateDoc,
    addDoc,
    Timestamp} from "firebase/firestore"

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
let userId = '';
onAuthStateChanged(auth, user => {
    userId = user.uid;
})
let array = [];
const db = getFirestore();
const driversCol = query(collection(db, "Driver"), orderBy('createdAt', 'desc'));
const driverReqCol = collection(db, 'DriverDocumentRequirements');
onSnapshot(driverReqCol, (snapshot) => {
  let count = 0;
  snapshot.forEach((entry) => {
    array[count] = entry.id;
    count++;
  })
});
async function getStatus(docID, data){
    const driverDocRef = doc(db, 'Driver', docID);
    const driversDocumentsRef = collection(driverDocRef, 'DriversDocuments');
    const docRef = query(driversDocumentsRef, limit(1));
    let listStatus = false;
    const snapshot = await getDocs(docRef);
    snapshot.forEach((doc) => {
      for(let i = 0; i < array.length; i++){
        if(!doc.get(`${array[i]}.Verified`) || doc.get(`${array[i]}.Verified`) == undefined){
          listStatus = false;
          break;
        }
        listStatus = doc.get(`${array[i]}.Verified`);
      }
    })
    if(data.blocked){
        return 'blocked';
    }else if(listStatus){
        console.log(true);
        return 'verified';
    }else{
        console.log(false);
        return 'unverified';
    }

}

function getStatus2(result){
    if(result=='verified'){
        return '<span class="badge bg-success">Verified</span>';
    }else if(result == 'unverified'){
        return '<span class="badge bg-danger">Unverified</span>';
    }else if(result=="blocked"){
        return '<span class="badge bg-dark">Blocked</span>';
    }
}

const documents = new Map();

getDocs(driversCol).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      documents.set(doc.id, doc.data());
    });
    renderDriversTable(documents);
  });

    onSnapshot(driversCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
                documents.set(change.doc.id, change.doc.data());
              } else if (change.type === "removed") {
                documents.delete(change.doc.id);
              }
        })
        renderDriversTable(documents);
    })

    function renderDriversTable(documents) {
        const tablebody = document.querySelector("#table1 tbody");
        tablebody.innerHTML = '';
      
        for (const [id, data] of documents) {
          const row = document.createElement("tr");
          data.rating.toFixed(1) <= 1.9 ? row.setAttribute('class', 'table-danger') : '';
          const col1 = document.createElement("td");
          const col2 = document.createElement("td");
          const col3 = document.createElement("td");
          const col4 = document.createElement("td");
          const col5 = document.createElement("td");
          const col6 = document.createElement("td");
          const col7 = document.createElement("td");
      
          col1.innerHTML = `Driver-${id.substring(0, 8)}`;
          col2.innerText = data.name;
          col3.innerText = data.phone_number == null || data.phone_number == '' ? 'N/A' : data.phone_number;
          col4.innerText = data.email == null || data.email == '' ? 'N/A' : data.email;
          col5.innerText = data.rating.toFixed(1);
      
          getStatus(id, data).then((result) => {
            if (result === 'verified') {
              row.setAttribute("data-status", 'active');
            } else if (result === 'unverified') {
              row.setAttribute("data-status", 'inactive');
            } else if (result === "blocked") {
              row.setAttribute("data-status", 'blocked');
            }
            col6.innerHTML = getStatus2(result);
            col7.innerHTML = col7.innerHTML + `<button class="btn ${result !== 'blocked' ? 'btn-dark' : 'btn-info'} btn-sm ${result !== 'blocked' ? 'block' : 'unblock'}" data-id="${id}"  ${result !== 'blocked' ? `data-bs-toggle="modal" data-bs-target="#warning2"` : ''}>
              <i data-feather="${result !== 'blocked' ? 'slash' : 'thumbs-up'}"></i>
            </button>`;
            feather.replace();
          });
          col7.innerHTML = `
            <button class="btn btn-success btn-sm viewMore" style="margin-right: 5px" data-id="${id}">
              <i data-feather="eye"></i>
            </button>
            <button class="btn btn-danger btn-sm showModal" data-bs-toggle="modal" data-bs-target="#warning" style="margin-right: 5px" data-id="${id}">
              <i data-feather="trash"></i>
            </button>
          `;
      
          row.appendChild(col1);
          row.appendChild(col2);
          row.appendChild(col3);
          row.appendChild(col4);
          row.appendChild(col5);
          row.appendChild(col6);
          row.appendChild(col7);
          tablebody.appendChild(row);
        }
      
        feather.replace();
      }
document.querySelector('table').addEventListener('click', async function(e) {
  if (e.target.classList.contains('viewMore')) {
    const itemId = e.target.getAttribute('data-id');
    console.log(itemId);
    window.location.href = `driversIn.html?driverUserId=${itemId}#driver`;
  }else if (e.target.classList.contains('block')) {
        const user = document.getElementById('User').innerText.substring(4);
        const itemId = e.target.getAttribute('data-id');
        document.getElementById('prompt2').innerText = `Are you sure you want to delete Driver-${itemId.substring(0,8)}?`;
        document.getElementById('block').setAttribute('data-id', itemId);
        
    }else if(e.target.classList.contains('unblock')){
        const user = document.getElementById('User').innerText.substring(4);
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
    }else if(e.target.classList.contains('showModal')){
      const itemId = e.target.getAttribute('data-id');
      document.getElementById('prompt').innerText = `Are you sure you want to delete Driver-${itemId.substring(0,8)}?`;
      document.getElementById('delete').setAttribute('data-id', itemId);
    }
});

document.getElementById('delete').onclick = async function(event){
  event.preventDefault();
  const user = document.getElementById('User').innerText.substring(4);
      const itemId = this.getAttribute('data-id');
      if(await checkDuplicate(itemId)){
        console.log('went here');
        document.getElementById('danger2').showModal();
        return;
      }
      await deleteDoc(doc(db, 'Driver', itemId));
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
      console.log(itemId);
        await updateDoc(doc(db, 'Driver', itemId), {
            blocked: true,
            reason: reason
        });
        document.getElementById('reason').value = '';
        await addDoc(collection(db, 'AdminLogs'), {
            user_id: userId,
            category: 'Drivers List',
            action: `${user} blocked Driver-${itemId.substring(0, 8)} reason: ${reason}`,
            actionTime: Timestamp.now(),
        });
}

async function checkDuplicate(id){
  const queryResult = query(collection(db, 'Trips'), where('driver.driver_id', '==', id), limit(1));
  const result = await getDocs(queryResult);
  if(!result.empty){
    return true;
  }else{
    return false;
  }
}