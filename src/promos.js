import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, 
    doc, collection, query, limit, 
    onSnapshot, getDocs, addDoc, updateDoc, where, getDoc, deleteDoc,
    Timestamp} from "firebase/firestore"
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"

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
const auth = getAuth();
let userId = '';
onAuthStateChanged(auth, user => {
  userId = user.uid;
})
const db = getFirestore(app);
const storage = getStorage(app);
const storageRef = ref(storage, 'promosPics');

const PromoCol = collection(db, "Promo");

const documents = new Map();

var fileNamePath;
var fileName;
var fileNamePath2;
var fileName2;
let type = false;
let type2 = false;
const vehicleTypes = new Set();
const vehicleTypes2 = new Set();

const fileInput = document.getElementById("file-selector");
const fileInput2 = document.getElementById("file-selector2");

fileInput.onchange = () => {
  fileNamePath = fileInput.files[0].name;
  fileName = fileInput.files[0];
  console.log(fileName);
}
fileInput2.onchange = () => {
  fileNamePath2 = fileInput2.files[0].name;
  fileName2 = fileInput2.files[0];
  console.log(fileName2);
}

getDocs(PromoCol).then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    documents.set(doc.id, doc.data());
  });
  renderTable();
});

onSnapshot(PromoCol, (snapshot) => {
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
      row.setAttribute('data-status', getPromoState2(data.start_date, data.end_date));
          const col1 = document.createElement("td");
          const col2 = document.createElement("td");
          col2.setAttribute('style', 'width: 100px;');
          const col3 = document.createElement("td");
          const col4 = document.createElement("td");
          const col5 = document.createElement("td");
          const col6 = document.createElement("td");
          const col7 = document.createElement("td");
          const col8 = document.createElement("td");
          const col9 = document.createElement("td");
  
          col1.innerHTML = `<img src="${data.banner}" alt="icon-${data.name}" width="50px" height="50px">`;
          col2.innerText = data.name;
          col3.innerText = (data.discount * 100) + '%';
          col4.innerText = formatTimestampIntl(data.start_date);
          col5.innerText = formatTimestampIntl(data.end_date);
          col6.innerHTML = data.description != '' ? data.description : 'N/A';
          col6.style.width = '230px';
          col7.innerText = data.location != '' ? data.location : 'N/A';
          col8.innerHTML = getPromoState(data.start_date, data.end_date);
          col9.innerHTML = `<button class="btn btn-warning btn-sm edit" style="width: 40px; padding-left: 10px; padding-right: 10px" data-id="${id}"><i data-feather="edit"></i></button>
          <button type="button" class="btn btn-danger btn-sm showModal" style="width: 40px; padding-left: 10px; padding-right: 10px"data-bs-toggle="modal" data-bs-target="#warning" data-id="${id}"><i data-feather="trash"></i></button>`;
          
  
          row.appendChild(col1);
          row.appendChild(col2);
          row.appendChild(col3);
          row.appendChild(col4);
          row.appendChild(col5);
          row.appendChild(col6);
          row.appendChild(col7);
          row.appendChild(col8);
          row.appendChild(col9);
          tablebody.appendChild(row);
  })
  feather.replace();
}

document.querySelector('table').addEventListener('click', function(e) {
  if (e.target.classList.contains('edit')) {
    const itemId = e.target.getAttribute('data-id');
    const popupForm1 = document.getElementById('popup2');
    popupForm1.style.display = "block";
    const itemData = documents.get(itemId);
    console.log(itemData);
    populateForm(itemData, itemId);
  }else if (e.target.classList.contains('showModal')) {
    const itemId = e.target.getAttribute('data-id');
    const data = documents.get(itemId);
    document.getElementById('prompt').innerText = `Are you sure you want to delete ${data.name}?`;
    document.getElementById('delete').setAttribute('data-id', itemId);
    console.log(document.getElementById('prompt').innerText);
  }
});

function populateForm(data, id){
  document.getElementById("editId").innerText = id;
  const img = document.getElementById("preview-image2");
  img.src = data.banner;
  document.getElementById("ePromoName").value = data.name;
  document.getElementById("eDiscount").value = data.discount * 100;
  document.getElementById("eStartDate").value = data.start_date;
  document.getElementById("eEndDate").value = data.end_date;
  document.getElementById("eDescription").value = data.description;
  const applied = document.getElementById('appliedVehicleTypes2');
  applied.innerHTML = '';
  data.location != '' ? data.location.forEach((value) => {
    vehicleTypes2.add(value);
  }) : vehicleTypes2.clear();
  vehicleTypes2.forEach((val) => {
    console.log(val);
    const item = document.createElement('a');
    item.setAttribute('data-id', val);
    item.setAttribute('style', "margin-right: 2px");
    item.setAttribute('class', 'btn btn-primary round remove');
    item.innerText = val;
    applied.appendChild(item);
  });
  document.getElementById('dropdown2').style.display = 'none';
  fetchData2();
}

function getPromoState2(start, end){
  const startDate = start;
  const endDate = end;
  const nowDate = Timestamp.now();
  if(startDate.toMillis() > nowDate.toMillis()){
    return 'notStarted';
  }else if(startDate.toMillis() <= nowDate.toMillis() && nowDate.toMillis() <=  endDate.toMillis()){
    return 'ongoing';
  }else if(endDate.toMillis() < nowDate.toMillis()){
    return 'finished';
  }
}
function getPromoState(start, end){
  const startDate = start;
  const endDate = end;
  const nowDate = Timestamp.now();
  if(startDate.toMillis() > nowDate.toMillis()){
    return '<span class="badge bg-light">Not started</span>';
  }else if(startDate.toMillis() <= nowDate.toMillis() && nowDate.toMillis() <=  endDate.toMillis()){
    return '<span class="badge bg-warning">Ongoing</span>';
  }else if(endDate.toMillis() < nowDate.toMillis()){
    return '<span class="badge bg-success">Finished</span>';
  }
}

document.getElementById("add-Promo-Button").onclick = async function(event) {
  const user = document.getElementById('User').innerText.substring(4);
  let form = document.getElementById("addForm");
  const popup = document.getElementById('popup');
  if(!form.checkValidity()){
    event.preventDefault();
    console.log('ran');
    form.reportValidity();
  }else{
    console.log('ran');
    let promoName = document.getElementById("promoName").value;
    let discount = document.getElementById("discount").valueAsNumber;
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let description = document.getElementById("description").value;
    

    const path = `promosPics/${fileNamePath}`
    const imageRef = ref(storage, path);

    let uploadTask = uploadBytesResumable(imageRef, fileName);

    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case 'paused':
          console.log('Upload is paused');
          break;
        case 'running':
          console.log('Upload is running');
          break;
      }
    },
      (error) => {
        console.log("Error is", error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadUrl) => {
          console.log('File available: ', downloadUrl);
          const newVehicleType = {
            banner: downloadUrl,
            path: path,
            promoName: promoName,
            discount: discount / 100,
            startDate: startDate,
            endDate: endDate,
            description: description,
          }
          if(!await checkDuplicate(newVehicleType) && checkDateInputs(startDate, endDate)){
            const array = Array.from(vehicleTypes);
            await addDoc(PromoCol, {
              "banner": downloadUrl,
              "banner_path": path,
              "name": promoName,
              "discount": discount / 100,
              "start_date": Timestamp.fromDate(new Date(startDate)),
              "end_date": Timestamp.fromDate(new Date(endDate)),
              "description": description,
              "location": array,
              "is_general_promo": type
            }).then(async () => {
              await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Promos',
                action: `${user} added ${promoName}`,
                actionTime: Timestamp.now(),
            });
            vehicleTypes.clear();
            document.getElementById('success').showModal();
            }).catch(() => {
              document.getElementById('danger2').showModal();
            });
            document.getElementById('Error').innerText = '';
            popup.style.display = 'none';
            form.reset();
            console.log('Added');
          }
        });
      }
    )
  }
  event.preventDefault();
};

function checkDateInputs(start, end){
  const startDate = new Date(start);
  const endDate = new Date(end);
  if(startDate.getTime() >= endDate.getTime()){
    document.getElementById('Error').innerText = 'Date conflict';
    return false;
  }else{
    return true;
  }
}

function formatTimestampIntl(timestamp) {
  const date = new Date(timestamp.toDate());
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

async function checkDuplicate(promoData){
  const {promoName, discount, endDate, path, startDate, description} = promoData;
  console.log(promoData);
  const q = query(collection(db, 'Promo'), where('name', '==', promoName));
  const q2 = query(collection(db, 'Promo'), where('banner_path', '==', path));
  const querySnapshot = await getDocs(q);
  const querySnapshot2 = await getDocs(q2);
  console.log(querySnapshot);
  console.log(querySnapshot2);

  if(!querySnapshot.empty){
    document.getElementById('Error').innerText = 'Promo name already exists';
    document.getElementById('Error2').innerText = 'Promo name already exists';
    console.log('not added');
    return true;
  }
  if(!querySnapshot2.empty){
    document.getElementById('Error').innerText = 'Banner already exists';
    document.getElementById('Error2').innerText = 'Banner already exists';
    console.log('not added');
    return true;
  }

  return false;

}

async function checkDuplicate2(promoData, id){
  const {promoName, discount, endDate, path, startDate, description} = promoData;
  console.log(promoData);
  const q = query(collection(db, 'Promo'), where('name', '==', promoName));
  const querySnapshot = await getDocs(q);
  console.log(querySnapshot);
  let exists = false;

  querySnapshot.forEach(doc => {
    if (doc.id !== id) {
      exists = true;
    }
  });

  return exists;

}

document.getElementById("update-Promo-Button").onclick = async function(event) {
  event.preventDefault();
  const user = document.getElementById('User').innerText.substring(4);
  let form = document.getElementById("updateForm");
  let typeId = document.getElementById("editId").innerText;
  const popup = document.getElementById('popup2');
  const driverDocRef = doc(db, 'Promo', typeId);
  if(!form.checkValidity()){
    event.preventDefault();
    console.log('ran');
    form.reportValidity();
  }else{
    event.preventDefault();
    console.log('ran');
    let promoName = document.getElementById("ePromoName").value;
    let discount = document.getElementById("eDiscount").valueAsNumber;
    let startDate = document.getElementById("eStartDate").value;
    let endDate = document.getElementById("eEndDate").value;
    let description = document.getElementById("eDescription").value;

    const path = `promosPics/${fileNamePath2}`
    const imageRef = ref(storage, path);
    if(fileName2 == null){
      console.log("emptyFile");
      const newVehicleType = {
        promoName: promoName,
        discount: discount / 100,
        startDate: startDate,
        endDate: endDate,
        description: description,
      }
      if(!await checkDuplicate2(newVehicleType, typeId) && checkDateInputs(startDate, endDate)){
        const array = Array.from(vehicleTypes2);
      await updateDoc(driverDocRef, {
        "name": promoName,
        "discount": discount / 100,
        "start_date": Timestamp.fromDate(new Date(startDate)),
        "end_date": Timestamp.fromDate(new Date(endDate)),
        "description": description,
        "location": array,
        "is_general_promo": type2
      }).then(async () => {
        await addDoc(collection(db, 'AdminLogs'), {
          user_id: userId,
          category: 'Promos',
          action: `${user} updated ${promoName}`,
          actionTime: Timestamp.now(),
      });
      vehicleTypes2.clear();
      document.getElementById('success2').showModal();
      }).catch(()=>{
        document.getElementById('danger2').showModal();
      });
      document.getElementById('Error2').innerText = '';
            popup.style.display = 'none';
            form.reset();
    }
      event.preventDefault();
    }else{
      let uploadTask = uploadBytesResumable(imageRef, fileName2);

    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case 'paused':
          console.log('Upload is paused');
          break;
        case 'running':
          console.log('Upload is running');
          break;
      }
    },
      (error) => {
        console.log("Error is", error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadUrl) => {
          console.log('File available: ', downloadUrl);
          const newVehicleType = {
            banner: downloadUrl,
            path: path,
            promoName: promoName,
            discount: discount / 100,
            startDate: startDate,
            endDate: endDate,
            description: description,
          }
          if(!await checkDuplicate(newVehicleType) && checkDateInputs(startDate, endDate)){
            const array = Array.from(vehicleTypes2);
            await updateDoc(driverDocRef, {
              "banner": downloadUrl,
              "banner_path": path,
              "name": promoName,
              "discount": discount / 100,
              "start_date": Timestamp.fromDate(new Date(startDate)),
              "end_date": Timestamp.fromDate(new Date(endDate)),
              "description": description,
              "location": array,
              "is_general_promo": type2
            }).then(async () => {
              await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Promos',
                action: `${user} updated ${promoName}`,
                actionTime: Timestamp.now(),
            });
            vehicleTypes2.clear();
            document.getElementById('success2').showModal();
      }).catch(()=>{
        document.getElementById('danger2').showModal();
      });
      document.getElementById('Error2').innerText = '';
      popup.style.display = 'none';
      form.reset();
          }
        });
      }
    )
    }
  }
  event.preventDefault();
};

document.getElementById('delete').onclick = async function(event) {
  event.preventDefault();
  const user = document.getElementById('User').innerText.substring(4);
  const itemId = this.getAttribute('data-id');
  const data = documents.get(itemId);
  const docRef = doc(db, 'Promo', itemId);
  const querying = query(collection(db, 'Trips'),
    where('promo.promo_name', '==', data.name),
    where('status', 'in', ['ongoing', 'pending']),
    limit(1)
  );
  let result = await getDocs(querying);
  if(result.empty){
    await deleteDoc(docRef);
    await addDoc(collection(db, 'AdminLogs'), {
      user_id: userId,
      category: 'Promos',
      action: `${user} deleted ${data.name}`,
      actionTime: Timestamp.now(),
  });
  }else{
    document.getElementById('danger').showModal();
  }
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

document.getElementById('status2').onclick = function(event){
  event.preventDefault();
  console.log('clicked');
  let drop = document.getElementById('statusMenu2');
  console.log(drop.getAttribute('class'));
  if(drop.getAttribute('class') == 'dropdown-menu'){
      drop.setAttribute('class', 'dropdown-menu');
      console.log('1');
  }else{
      drop.setAttribute('class', 'dropdown-menu show');
      console.log('2');
  }
}

document.getElementById('activeStatus').onclick = function(event){
  event.preventDefault();
  let drop = document.getElementById('statusMenu');
  let status = document.getElementById('status');
  let option1 = document.getElementById('activeStatus').innerText;
  document.getElementById('vehicleTypes').style.display = 'none';
  type = true;
  status.innerText = option1;
  drop.setAttribute('class', 'dropdown-menu');

}

document.getElementById('activeStatus2').onclick = function(event){
  event.preventDefault();
  let drop = document.getElementById('statusMenu2');
  let status = document.getElementById('status2');
  let option1 = document.getElementById('activeStatus2').innerText;
  document.getElementById('vehicleTypes2').style.display = 'none';
  type = true;
  status.innerText = option1;
  drop.setAttribute('class', 'dropdown-menu');

}

document.getElementById('inactiveStatus').onclick = function(event){
  event.preventDefault();
  let drop = document.getElementById('statusMenu');
  let status = document.getElementById('status');
  let option2 = document.getElementById('inactiveStatus').innerText;
  document.getElementById('vehicleTypes').style.display = 'flex';
  type = false;
  status.innerText = option2;
  drop.setAttribute('class', 'dropdown-menu');

}

document.getElementById('inactiveStatus2').onclick = function(event){
  event.preventDefault();
  let drop = document.getElementById('statusMenu2');
  let status = document.getElementById('status2');
  let option2 = document.getElementById('inactiveStatus2').innerText;
  document.getElementById('vehicleTypes2').style.display = 'flex';
  type = false;
  status.innerText = option2;
  drop.setAttribute('class', 'dropdown-menu');

}
document.addEventListener("DOMContentLoaded", fetchData);

function fetchData() {
  const dropdown = document.getElementById('dropdown');

  // Fetch data from Firestore collection
  onSnapshot(collection(db, 'VehicleType'), (snapshot) => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement('div');
      item.textContent = data.type; // Adjust 'name' to your field
      item.setAttribute('data-value', data.id); // Store the ID
      item.addEventListener('click', () => selectOption(data.type));
      dropdown.appendChild(item);
    });
    dropdown.style.display = 'block';
  });
}

function fetchData2() {
  const dropdown = document.getElementById('dropdown2');

  // Fetch data from Firestore collection
  onSnapshot(collection(db, 'VehicleType'), (snapshot) => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement('div');
      item.textContent = data.type; // Adjust 'name' to your field
      item.setAttribute('data-value', data.id); // Store the ID
      item.addEventListener('click', () => selectOption2(data.type));
      dropdown.appendChild(item);
    });
    dropdown.style.display = 'block';
  });
}

function filterOptions() {
  console.log('up');
  const input = document.getElementById('vehicleSearch').value;
  const options = document.querySelectorAll('#dropdown div');
  const dropdown = document.getElementById('dropdown');
  let hasVisibleOptions = false;

  options.forEach(option => {
    if (option.textContent.toLowerCase().includes(input.toLowerCase())) {
      option.style.display = '';
      hasVisibleOptions = true;
    } else {
      option.style.display = 'none';
    }
  });

  dropdown.style.display = hasVisibleOptions ? 'block' : 'none';
}

function filterOptions2() {
  console.log('up');
  const input = document.getElementById('vehicleSearch2').value;
  const options = document.querySelectorAll('#dropdown2 div');
  const dropdown = document.getElementById('dropdown2');
  let hasVisibleOptions = false;

  options.forEach(option => {
    if (option.textContent.toLowerCase().includes(input.toLowerCase())) {
      option.style.display = '';
      hasVisibleOptions = true;
    } else {
      option.style.display = 'none';
    }
  });

  dropdown.style.display = hasVisibleOptions ? 'block' : 'none';
}

function selectOption(value) {
  vehicleTypes.add(value);
  console.log(vehicleTypes);
  const applied = document.getElementById('appliedVehicleTypes');
  applied.innerHTML = '';
  vehicleTypes.forEach((val) => {
    console.log(val);
    const item = document.createElement('a');
    item.setAttribute('data-id', val);
    item.setAttribute('style', "margin-right: 2px");
    item.setAttribute('class', 'btn btn-primary round remove');
    item.innerText = val;
    applied.appendChild(item);
  });
  document.getElementById('dropdown').style.display = 'none';
}

function selectOption2(value) {
  vehicleTypes2.add(value);
  console.log(vehicleTypes2);
  const applied = document.getElementById('appliedVehicleTypes2');
  applied.innerHTML = '';
  vehicleTypes2.forEach((val) => {
    console.log(val);
    const item = document.createElement('a');
    item.setAttribute('data-id', val);
    item.setAttribute('style', "margin-right: 2px");
    item.setAttribute('class', 'btn btn-primary round remove');
    item.innerText = val;
    applied.appendChild(item);
  });
  document.getElementById('dropdown2').style.display = 'none';
}

document.querySelector('#appliedVehicleTypes').addEventListener('click', function (e){
  if(e.target.classList.contains('remove')){
    const val = e.target.getAttribute('data-id');
    vehicleTypes.delete(val);
    const applied = document.getElementById('appliedVehicleTypes');
    applied.innerHTML = '';
    vehicleTypes.forEach((val) => {
      console.log(val);
      const item = document.createElement('a');
      item.setAttribute('data-id', val);
      item.setAttribute('style', "margin-right: 2px");
      item.setAttribute('class', 'btn btn-primary round remove');
      item.innerText = val;
      applied.appendChild(item);
    });
  }
});

document.querySelector('#appliedVehicleTypes2').addEventListener('click', function (e){
  if(e.target.classList.contains('remove')){
    const val = e.target.getAttribute('data-id');
    vehicleTypes2.delete(val);
    const applied = document.getElementById('appliedVehicleTypes2');
    applied.innerHTML = '';
    vehicleTypes2.forEach((val) => {
      console.log(val);
      const item = document.createElement('a');
      item.setAttribute('data-id', val);
      item.setAttribute('style', "margin-right: 2px");
      item.setAttribute('class', 'btn btn-primary round remove');
      item.innerText = val;
      applied.appendChild(item);
    });
  }
});

document.getElementById('cancel').onclick = function (event){
  event.preventDefault();
  vehicleTypes.clear();
  const openFormButton = document.getElementById('openFormButton');
  const popupForm = document.getElementById('popup');
  popupForm.style.display = 'none';
  let form = document.getElementById("addForm");
  let img = document.getElementById("preview-image");
  img.src = 'https://via.placeholder.com/40';
  document.getElementById('vehicleTypes').style.display = 'none';
  let status = document.getElementById('status');
  status.innerText = 'General Promo';
  form.reset();
}
document.getElementById('cancel2').onclick = function (event){
  event.preventDefault();
  vehicleTypes2.clear();
  const openFormButton2 = document.getElementById('openFormButton2');
  const popupForm2 = document.getElementById('popup2');
  popupForm2.style.display = 'none';
  let form2 = document.getElementById("updateForm");
  let img2 = document.getElementById("preview-image2");
  img2.src = 'https://via.placeholder.com/40';
  document.getElementById('vehicleTypes2').style.display = 'none';
  let status = document.getElementById('status2');
  status.innerText = 'General Promo';
  form2.reset();
}

window.filterOptions = filterOptions;
window.filterOptions2 = filterOptions2;