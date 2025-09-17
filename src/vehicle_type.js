import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore, 
    doc, collection, query, limit, 
    onSnapshot, getDocs, addDoc, updateDoc, where, getDoc, Timestamp, deleteDoc} from "firebase/firestore"
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
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
let userId = '';
onAuthStateChanged(auth, user => {
  userId = user.uid;
})
const storageRef = ref(storage, 'vehicleTypeIcons');

var fileNamePath;
var fileName;

const fileInput = document.getElementById("file-selector");

fileInput.onchange = () => {
  fileNamePath = fileInput.files[0].name;
  fileName = fileInput.files[0];
  console.log(fileName);
}

const VehicleTypeCol = collection(db, "VehicleType");

document.getElementById("add-VehicleType-Button").onclick = async function(event) {
  const user = document.getElementById('User').innerText.substring(4);
  let form = document.getElementById("addForm");
  let popUp = document.getElementById("popupForm");
  if(!form.checkValidity()){
    event.preventDefault();
    console.log('ran');
    form.reportValidity();
  }else{
    console.log('ran');
    let type = document.getElementById("type").value;
    let capacity = document.getElementById("capacity").valueAsNumber;
    let wheels = document.getElementById("wheels").valueAsNumber;
    let base_rate = document.getElementById("baseRate").valueAsNumber;
    let rate_per_km = document.getElementById("rate-per-km").valueAsNumber;

    const path = `vehicleTypeIcons/${fileNamePath}`
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
            icon: downloadUrl,
            path: path,
            type: type,
            wheels: wheels,
            capacity: capacity,
            base_rate: base_rate,
            rate_per_km: rate_per_km,
            status: true,
          }
          if(!await checkDuplicate(newVehicleType)){
            await addDoc(VehicleTypeCol, {
              "icon": downloadUrl,
              "icon_path": path,
              "type": type,
              "wheels": wheels,
              "capacity": capacity,
              "base_rate": base_rate,
              "rate_per_km": rate_per_km,
              "status": true,
            }).then(async () => {
              await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Vehicle Type',
                action: `${user} added ${type}`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success').showModal();
            }).catch(() => {
              document.getElementById('danger2').showModal();
            });
            
            console.log('Added');
          }
        });
      }
    )
  }
  popUp.style.display = 'none';
  event.preventDefault();
};

async function checkDuplicate(vehicleTypeData){
  const {type, base_rate, capacity, path, icon, rate_per_km, status} = vehicleTypeData;
  console.log(vehicleTypeData);
  const q = query(collection(db, 'VehicleType'), where('type', '==', type));
  const q2 = query(collection(db, 'VehicleType'), where('icon_path', '==', path));
  const querySnapshot = await getDocs(q);
  const querySnapshot2 = await getDocs(q2);
  console.log(querySnapshot);
  console.log(querySnapshot2);

  if(!querySnapshot.empty){
    document.getElementById('Error').innerText = 'Type already exists';
    document.getElementById('Error2').innerText = 'Type already exists';
    console.log('not added');
    return true;
  }
  if(!querySnapshot2.empty){
    document.getElementById('Error').innerText = 'Icon already exists';
    document.getElementById('Error2').innerText = 'Icon already exists';
    console.log('not added');
    return true;
  }

  return false;

}

async function checkDuplicate2(vehicleTypeData, typeId){
  const {type, base_rate, capacity, path, icon, rate_per_km, status} = vehicleTypeData;
  console.log(vehicleTypeData);
  const q = query(collection(db, 'VehicleType'), where('type', '==', type));
  const querySnapshot = await getDocs(q);
  console.log(querySnapshot);
  const doc = querySnapshot.docs.at(0);
  if(!querySnapshot.empty && doc.id != typeId){
    document.getElementById('Error2').innerText = 'Type already exists';
    console.log('not added');
    return true;
  }
  return false;

}

const documents = new Map();

getDocs(VehicleTypeCol).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      documents.set(doc.id, doc.data());
    });
    renderTable();
  });

onSnapshot(VehicleTypeCol, (snapshot) => {
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
        row.setAttribute('data-status', data.status.toString());
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col7 = document.createElement("td");
            const col8 = document.createElement("td");
            const col9 = document.createElement("td");
    
            col1.innerHTML = `<img src="${data.icon}" alt="icon-${data.type}" width="50px" height="50px">`;
            col2.innerText = data.type;
            col3.innerText = data.capacity;
            col4.innerText = '₱' + data.base_rate;
            col5.innerText = '₱' + data.rate_per_km;
            col6.innerHTML = data.wheels;
            col7.innerHTML = data.status ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Inactive</span>';
            col8.innerHTML = data.status ? `<button class="btn btn-danger btn-sm statusChange" data-id="${id}">Deactivate</button>` : `<button class="btn btn-success btn-sm statusChange" data-id="${id}">Activate</button>`;
            col9.innerHTML = `<button class="btn btn-warning btn-sm edit" data-id="${id}"><i data-feather="edit"></i></button>
            <button type="button" class="btn btn-danger btn-sm showModal" data-bs-toggle="modal" data-bs-target="#warning" data-id="${id}"><i data-feather="trash"></i></button>`;
            
    
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

document.querySelector('table').addEventListener('click', async function(e) {
  console.log('clicked');
  const user = document.getElementById('User').innerText.substring(4);
  if (e.target.classList.contains('showModal')) {
    const itemId = e.target.getAttribute('data-id');
    const data = documents.get(itemId);
    document.getElementById('prompt').innerText = `Are you sure you want to delete ${data.type}?`;
    document.getElementById('delete').setAttribute('data-id', itemId);
    console.log(document.getElementById('prompt').innerText);
  }else if (e.target.classList.contains('statusChange')) {
    const itemId = e.target.getAttribute('data-id');
    const driverDocRef = doc(db, 'VehicleType', itemId);
    const itemData = documents.get(itemId);
    const val = itemData.status;
    await updateDoc(driverDocRef, {
        status: !val,
    });
    await addDoc(collection(db, 'AdminLogs'), {
      user_id: userId,
      category: 'Vehicle Type',
      action: `${user} changed the status of ${itemData.type} to ${!val == true ? 'Activated' : 'Deactivated'}`,
      actionTime: Timestamp.now(),
  });
  }else if (e.target.classList.contains('edit')) {
    const itemId = e.target.getAttribute('data-id');
    const popupForm1 = document.getElementById('popupForm1');
    popupForm1.style.display = "block";
    const itemData = documents.get(itemId);
    console.log(itemData);
    populateForm(itemData, itemId);
  }
});

function populateForm(data, id){
  document.getElementById("editId").innerText = id;
  const img = document.getElementById("preview-image2");
  img.src = data.icon;
  document.getElementById("vType").value = data.type;
  document.getElementById("vCapacity").value = data.capacity;
  document.getElementById("vWheels").value = data.wheels;
  document.getElementById("vBaseRate").value = data.base_rate;
  document.getElementById("vRatePerKm").value = data.rate_per_km;
}

var fileName2;
var fileNamePath2;
const fileInput2 = document.getElementById("file-selector2");

fileInput2.onchange = () => {
  fileNamePath2 = fileInput2.files[0].name;
  fileName2 = fileInput2.files[0];
  console.log(fileName2);
}

document.getElementById("update-VehicleType-Button").onclick = async function(event) {
  event.preventDefault();
  const user = document.getElementById('User').innerText.substring(4);
  let form = document.getElementById("updateForm");
  let typeId = document.getElementById("editId").innerText;
  let popUp = document.getElementById("popupForm1");
  const driverDocRef = doc(db, 'VehicleType', typeId);
  if(!form.checkValidity()){
    event.preventDefault();
    console.log('ran');
    form.reportValidity();
  }else{
    event.preventDefault();
    console.log('ran');
    let type = document.getElementById("vType").value;
    let capacity = document.getElementById("vCapacity").valueAsNumber;
    let wheels = document.getElementById("vWheels").valueAsNumber;
    let base_rate = document.getElementById("vBaseRate").valueAsNumber;
    let rate_per_km = document.getElementById("vRatePerKm").valueAsNumber;

    const path = `vehicleTypeIcons/${fileNamePath2}`
    const imageRef = ref(storage, path);
    if(fileName2 == null){
      console.log("emptyFile");
      const newVehicleType = {
        type: type,
        wheels: wheels,
        capacity: capacity,
        base_rate: base_rate,
        rate_per_km: rate_per_km,
        status: true,
      }
      if(!await checkDuplicate2(newVehicleType, typeId)){
      await updateDoc(driverDocRef, {
        "type": type,
        "capacity": capacity,
        "wheels": wheels,
        "base_rate": base_rate,
        "rate_per_km": rate_per_km,
      }).then(async () => {
        await addDoc(collection(db, 'AdminLogs'), {
          user_id: userId,
          category: 'Vehicle Type',
          action: `${user} updated ${type}`,
          actionTime: Timestamp.now(),
      });
      document.getElementById('success2').showModal();
      }).catch(() => {
        document.getElementById('danger2').showModal();
      });
      
      popUp.style.display = 'none';
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
            icon: downloadUrl,
            path: path,
            type: type,
            wheels: wheels,
            capacity: capacity,
            base_rate: base_rate,
            rate_per_km: rate_per_km,
            status: true,
          }
          console.log(downloadUrl);
          console.log(path);
          if(!await checkDuplicate2(newVehicleType, typeId)){
            await updateDoc(driverDocRef, {
              "icon": downloadUrl,
              "icon_path": path,
              "type": type,
              "capacity": capacity,
              "wheels": wheels,
              "base_rate": base_rate,
              "rate_per_km": rate_per_km,
              "status": true,
            }).then(async () => {
              await addDoc(collection(db, 'AdminLogs'), {
                user_id: userId,
                category: 'Vehicle Type',
                action: `${user} updated ${type}`,
                actionTime: Timestamp.now(),
            });
            document.getElementById('success2').showModal();
            }).catch(() => {
              document.getElementById('danger2').showModal();
            });
            
          }
        });
        popUp.style.display = 'none';
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
  const docRef = doc(db, 'VehicleType', itemId);
  const querying = query(collection(db, 'Trips'),
    where('vehicleType', '==', data.type),
    limit(1)
  );
  let result = await getDocs(querying);
  if(result.empty){
    await deleteDoc(docRef);
    await addDoc(collection(db, 'AdminLogs'), {
      user_id: userId,
      category: 'Vehicle Type',
      action: `${user} deleted ${data.type}}`,
      actionTime: Timestamp.now(),
  });
  }else{
    document.getElementById('danger').showModal();
  }
}