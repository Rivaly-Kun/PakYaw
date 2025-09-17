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
const db = getFirestore(app);
const auth = getAuth(app);
let userId = '';
onAuthStateChanged(auth, user => {
    userId = user.uid;
})
const driverReqCol = collection(db, 'FleetDocumentRequirements');

const documents = new Map();

getDocs(driverReqCol).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        documents.set(doc.id, doc.data());
    });
    renderTable();
  });
onSnapshot(driverReqCol, (snapshot) => {
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
    const tablebody = document.querySelector("#table1 tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const row = document.createElement("tr");
        data.Businesses ? row.setAttribute('data-status', 'For businesses') : row.setAttribute('data-status', 'Non businesses')
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col7 = document.createElement("td");
    
            col1.innerText = id;
            col2.innerText = data.Description == '' ? 'N/A' : data.Description;
            col3.innerText = data.Businesses ? 'Yes' : 'No';
            col4.innerText = data.Identification ? 'Required' : 'Not required';
            col5.innerText = data.ExpiryDate ? 'Required' : 'Not required';
            col6.innerText = data.IssuanceDate ? 'Required' : 'Not required';
            col7.innerHTML = `<button class="btn btn-warning btn-sm edit" id="editRow" data-id="${id}"><i data-feather="edit"></i></button>
            <button type="button" id="showModal" class="btn btn-danger showModal" data-bs-toggle="modal" data-bs-target="#warning" data-id="${id}"><i data-feather="trash"></i></button>`;
            
    
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
    document.querySelectorAll("#editRow").forEach( button => {
        button.addEventListener('click', function(){
          const itemId = this.getAttribute('data-id');
          const popupForm1 = document.getElementById('popup2');
          popupForm1.style.display = "block";
          const itemData = documents.get(itemId);
          console.log(itemData);
          populateForm(itemData, itemId);
        })
      })
    
      document.querySelectorAll("#showModal").forEach( button => {
        button.addEventListener('click', function(){
          const itemId = this.getAttribute('data-id');
          document.getElementById('prompt').innerText = `Are you sure you want to delete ${itemId}?`;
          document.getElementById('delete').setAttribute('data-id', itemId);
        })
      })

      

      function populateForm(data, id){
        document.getElementById('requireForm2').setAttribute('data-id', id);
        document.getElementById('typeOfDoc2').value = id;
        document.getElementById('documentDesc2').value = data.Description;
        document.getElementById('Company2').checked = data.Businesses;
        document.getElementById('ExpiryDate2').checked = data.ExpiryDate;
        document.getElementById('IssuanceDate2').checked = data.IssuanceDate;
        document.getElementById('Identification2').checked = data.Identification;
      }
}

document.getElementById('addRequiredDocument').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let form = document.getElementById('requireForm');
    let description = document.getElementById('documentDesc').value;
    let company = document.getElementById("Company");
    let expiry = document.getElementById("ExpiryDate");
    let issuance = document.getElementById("IssuanceDate");
    let identification = document.getElementById("Identification");
    let popUp = document.getElementById("popup");
    let typeOfDoc = document.getElementById('typeOfDoc');
    if(!form.checkValidity()){
        console.log("ran");
        form.reportValidity();
    }else{
        let companyVal = company.checked ? true : false;
        let expiryVal = expiry.checked ? true : false;
        let issuanceVal = issuance.checked ? true : false;
        let identificationVal = identification.checked ? true : false;
        if(!await checkDuplicate(typeOfDoc.value)){
            await setDoc(doc(db, 'FleetDocumentRequirements', typeOfDoc.value), {
                Description: description,
                Businesses: companyVal,
                ExpiryDate: expiryVal,
                IssuanceDate: issuanceVal,
                Identification: identificationVal,
            }).then(async ()=>{
                await addDoc(collection(db, 'AdminLogs'), {
                    user_id: userId,
                    category: 'Fleet Document Requirements',
                    action: `${user} added ${typeOfDoc.value}`,
                    actionTime: Timestamp.now(),
                });
                document.getElementById('success').showModal();
            }).catch(()=>{
                document.getElementById('danger').showModal();
            })
            console.log('added');
            form.reset();
            popUp.style.display = "none";
        }
    }
}
document.getElementById('editRequiredDocument').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    let form = document.getElementById('requireForm2');
    let id = document.getElementById('requireForm2').getAttribute('data-id');
    let description = document.getElementById('documentDesc2').value;
    let company = document.getElementById("Company2");
    let expiry = document.getElementById("ExpiryDate2");
    let issuance = document.getElementById("IssuanceDate2");
    let identification = document.getElementById("Identification2");
    let popUp = document.getElementById("popup2");
    let typeOfDoc = document.getElementById('typeOfDoc2');
    if(!form.checkValidity()){
        console.log("ran");
        form.reportValidity();
    }else{
        let companyVal = company.checked ? true : false;
        let expiryVal = expiry.checked ? true : false;
        let issuanceVal = issuance.checked ? true : false;
        let identificationVal = identification.checked ? true : false;
        if(!await checkDuplicate2(typeOfDoc.value, id)){
            await deleteDoc(doc(db, 'FleetDocumentRequirements', typeOfDoc.value));
            await setDoc(doc(db, 'FleetDocumentRequirements', typeOfDoc.value), {
                Description: description,
                Businesses: companyVal,
                ExpiryDate: expiryVal,
                IssuanceDate: issuanceVal,
                Identification: identificationVal,
            }).then(async () => {
                await addDoc(collection(db, 'AdminLogs'), {
                    user_id: userId,
                    category: 'Fleet Document Requirements',
                    action: `${user} edited ${typeOfDoc.value}`,
                    actionTime: Timestamp.now(),
                });
                document.getElementById('success2').showModal();
            }).catch(()=>{
                document.getElementById('danger').showModal();
            })

            console.log('added');
            form.reset();
            popUp.style.display = "none";
        }
    }
}
async function checkDuplicate(typeOfDoc){
    console.log(typeOfDoc);
    const docRef = doc(db, 'FleetDocumentRequirements', typeOfDoc);
    const documentSnaphot = await getDoc(docRef);
    console.log(documentSnaphot);
    if(documentSnaphot.data() != null){
        document.getElementById('Error2').innerText = 'This type of document already exists.';
        console.log('exists');
        return true;
    }else{
        return false;
    }
}
async function checkDuplicate2(typeOfDoc, id){
    console.log(typeOfDoc);
    const docRef = doc(db, 'FleetDocumentRequirements', typeOfDoc);
    const documentSnaphot = await getDoc(docRef);
    console.log(documentSnaphot);
    if(documentSnaphot.data() != null && typeOfDoc != id){
        document.getElementById('Error').innerText = 'This type of document already exists.';
        console.log('exists');
        return true;
    }else{
        return false;
    }
}

document.getElementById('delete').onclick = async function(event) {
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    const itemId = this.getAttribute('data-id');
    const docRef = doc(db, 'FleetDocumentRequirements', itemId);
    await deleteDoc(docRef).then(async ()=>{
        await addDoc(collection(db, 'AdminLogs'), {
            user_id: userId,
            category: 'Fleet Document Requirements',
            action: `${user} deleted ${itemId}`,
            actionTime: Timestamp.now(),
        });
        document.getElementById('success3').showModal();
    }).catch(()=>{
        document.getElementById('danger').showModal();
    });
}