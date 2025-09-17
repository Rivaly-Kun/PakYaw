import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged} from "firebase/auth"
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
let discountState = false;
let discountState2 = false;
onAuthStateChanged(auth, user => {
    userId = user.uid;
})
const db = getFirestore(app);
const discountCol = collection(db, 'Discounts');

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
    const tablebody = document.querySelector("#table1 tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const row = document.createElement("tr");
        row.setAttribute("data-status", data.status);
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col7 = document.createElement("td");
    
            col1.innerText = "discount-" + id.substring(0, 4);
            col2.innerText = data.discount_name;
            col3.innerText = data.description;
            col4.innerText = data.discount != 0 ? (data.discount * 100) + "%" : "₱" + data.peso_value;
            col5.innerText = data.status;

            col6.innerHTML = `<div class="btn btn-warning btn-sm" style="width: 40px; padding-left: 10px; padding-right: 10px" id="editRow" data-id="${id}"><i data-feather="edit" class="large-icon"></i></div>
             <button type="button" id="showModal" class="btn btn-danger btn-sm" style="width: 40px; padding-left: 10px; padding-right: 10px"data-bs-toggle="modal" data-bs-target="#warning" data-id="${id}"><i data-feather="trash"></i></button>`;
    
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col3);
            row.appendChild(col4);
            row.appendChild(col5);
            row.appendChild(col6);
            tablebody.appendChild(row);
    })
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
          console.log('clicked' + itemId);
          document.getElementById('prompt').innerText = `Are you sure you want to delete discount-${itemId.substring(0, 4)}?`;
          document.getElementById('delete').setAttribute('data-id', itemId);
        })
      })

      feather.replace();

      

      function populateForm(data, id){
        const switchOne = document.getElementById('percentageCont');
        const switchTwo = document.getElementById('pesoCont');
        const input = document.getElementById('discount2');
        const input2 = document.getElementById('peso2');
        document.getElementById('discountForm2').setAttribute('data-id', id);
        document.getElementById('discountName2').value = data.discount_name;
        document.getElementById('discountDesc2').value = data.description;
        if(data.peso_value != 0){
            switchOne.style.display = 'none';
            switchTwo.style.display = 'block';
            input.removeAttribute('required', '');
            input2.setAttribute('required' , '');
            discountState2 = true;
        }else if(data.discount != 0){
            switchOne.style.display = 'block';
            switchTwo.style.display = 'none';
            input2.removeAttribute('required', '');
            input.setAttribute('required' , '');
            discountState2 = false;
        }
        document.getElementById('discount2').value = data.discount * 100;
        document.getElementById('peso2').value = data.peso_value;
        document.getElementById('status').innerText = data.status;
      }
}

document.getElementById('addDiscount').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    const form = document.getElementById('discountForm');
    const popup = document.getElementById('popup');
    if(!form.checkValidity()){
        form.reportValidity();
    }else{
        let discountName = document.getElementById('discountName').value;
        let description = document.getElementById('discountDesc').value;
        let discount = !discountState ? document.getElementById('discount').value / 100 : 0;
        let peso = discountState ? document.getElementById('peso').value : 0;
        if(!await checkDuplicate(discountName)){
            await addDoc(discountCol, {
                discount_name: discountName,
                description: description,
                discount: parseFloat(discount),
                peso_value: parseFloat(peso),
                status: 'Active',
            }).then(async ()=>{
                await addDoc(collection(db, 'AdminLogs'), {
                    user_id: userId,
                    category: 'Discount',
                    action: `${user} added ${discountName}`,
                    actionTime: Timestamp.now(),
                });
                document.getElementById('success').showModal();
            }).catch(() => {
                document.getElementById('danger').showModal();
            })
            document.getElementById('Error').innerText = '';
            popup.style.display = 'none';
            form.reset();
        }
    }
}

document.getElementById('editDiscount').onclick = async function(event){
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    const form = document.getElementById('discountForm2');
    const popup = document.getElementById('popup2');
    if(!form.checkValidity()){
        form.reportValidity();
    }else{
        let discountName = document.getElementById('discountName2').value;
        let description = document.getElementById('discountDesc2').value;
        let discount = !discountState2 ? document.getElementById('discount2').value / 100 : 0;
        let peso = discountState2 ? document.getElementById('peso2').value : 0;
        let status = document.getElementById('status').innerText;
        if(!await checkDuplicate2(discountName, form.getAttribute('data-id'))){
            await updateDoc(doc(db, 'Discounts', form.getAttribute('data-id')), {
                discount_name: discountName,
                description: description,
                discount: parseFloat(discount),
                peso_value: parseFloat(peso),
                status: status,
            }).then(async ()=>{
                await addDoc(collection(db, 'AdminLogs'), {
                    user_id: userId,
                    category: 'Discount',
                    action: `${user} updated ${discountName}`,
                    actionTime: Timestamp.now(),
                });
                document.getElementById('success2').showModal();
            }).catch(() => {
                document.getElementById('danger').showModal();
            })
            document.getElementById('Error2').innerText = '';
            popup.style.display = 'none';
            form.reset();
        }
    }
}

async function checkDuplicate(discountName){
    console.log(discountName);
    const q = query(collection(db, 'Discounts'), where('discount_name', '==', discountName));
    const documentSnaphot = await getDocs(q);
    if(documentSnaphot.docs.length != 0){
        document.getElementById('Error').innerText = 'This Discount already exists.';
        console.log('exists');
        return true;
    }else{
        return false;
    }
}
async function checkDuplicate2(discountName, id){
    console.log(discountName);
    const q = query(collection(db, 'Discounts'), where('discount_name', '==', discountName));
    const documentSnaphot = await getDocs(q);
    let exists = false;

    documentSnaphot.forEach(doc => {
    if (doc.id !== id) {
      exists = true;
      document.getElementById('Error2').innerText = 'This Discount already exists.';
    }
  });

  return exists;

}

document.getElementById('status').onclick = function(event){
    event.preventDefault();
    console.log('clicked');
    let drop = document.getElementById('statusMenu');
    console.log(drop.getAttribute('class'));
    if(drop.getAttribute('class') == 'dropdown-menu'){
        drop.setAttribute('class', 'dropdown-menu');
        console.log('1');
    }else{
        drop.setAttribute('class', 'dropdown-menu show');
        console.log('2');
    }
}

document.getElementById('statusFilter').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('statusMenuFilter');
    if(drop.getAttribute('class') == 'dropdown-menu'){
        drop.setAttribute('class', 'dropdown-menu');
    }else{
        drop.setAttribute('class', 'dropdown-menu show');
    }
}

document.getElementById('activeStatus').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('statusMenu');
    let status = document.getElementById('status');
    let option1 = document.getElementById('activeStatus').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');

}
document.getElementById('inactiveStatus').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('statusMenu');
    let status = document.getElementById('status');
    let option2 = document.getElementById('inactiveStatus').innerText;
    status.innerText = option2;
    drop.setAttribute('class', 'dropdown-menu');

}
document.getElementById('delete').onclick = async function(event) {
    event.preventDefault();
    const user = document.getElementById('User').innerText.substring(4);
    const itemId = this.getAttribute('data-id');
    const docRef = doc(db, 'Discounts', itemId);
    const data = documents.get(itemId);
    const querying = query(collection(db, 'Trips'),
    where('discount.discount_name', '==', data.discount_name),
    where('status', 'in', ['ongoing', 'pending']),
    limit(1)
  );
  let result = await getDocs(querying);
  if(result.empty){
    await deleteDoc(docRef);
    await addDoc(collection(db, 'AdminLogs'), {
        user_id: userId,
        category: 'Discount',
        action: `${user} deleted ${data.discount_name}`,
        actionTime: Timestamp.now(),
    });
  }else{
    document.getElementById('danger2').showModal();
  }
}

document.getElementById('switch').onclick = function(event){
    event.preventDefault();
    const switchOne = document.getElementById('percentageCont');
    switchOne.style.display = 'none';
    const switchTwo = document.getElementById('pesoCont');
    switchTwo.style.display = 'block';
    const input = document.getElementById('discount2');
    input.removeAttribute('required', '');
    const input2 = document.getElementById('peso2');
    input2.setAttribute('required' , '');
    discountState2 = true;
}
document.getElementById('switch2').onclick = function(event){
    event.preventDefault();
    const switchOne = document.getElementById('percentageCont');
    switchOne.style.display = 'block';
    const switchTwo = document.getElementById('pesoCont');
    switchTwo.style.display = 'none';
    const input = document.getElementById('discount2');
    input.setAttribute('required', '');
    const input2 = document.getElementById('peso2');
    input2.removeAttribute('required' , '');
    discountState2 = false;
}

document.getElementById('switch3').onclick = function(event){
    event.preventDefault();
    const switchOne = document.getElementById('percentageCont2');
    switchOne.style.display = 'none';
    const switchTwo = document.getElementById('pesoCont2');
    switchTwo.style.display = 'block';
    const input = document.getElementById('discount');
    input.removeAttribute('required', '');
    const input2 = document.getElementById('peso');
    input2.setAttribute('required' , '');
    discountState2 = true;
}
document.getElementById('switch4').onclick = function(event){
    event.preventDefault();
    const switchOne = document.getElementById('percentageCont2');
    switchOne.style.display = 'block';
    const switchTwo = document.getElementById('pesoCont2');
    switchTwo.style.display = 'none';
    const input = document.getElementById('discount');
    input.setAttribute('required', '');
    const input2 = document.getElementById('peso');
    input2.removeAttribute('required' , '');
    discountState2 = false;
}