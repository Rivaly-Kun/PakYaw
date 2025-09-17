import { initializeApp } from "firebase/app"
import { getFirestore, 
    getDocs, getDoc, doc, collection, query,
    onSnapshot, updateDoc, 
    where} from "firebase/firestore"


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
const driversCol = collection(db, "Driver");

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const userId = urlParams.get('driverUserId');

getDriver(userId);

const driverVehiclesCol = collection(db, 'Vehicle');
const VehicleTypeCol = collection(db, "VehicleType");
const q = query(driverVehiclesCol, where('driver.driver_id', '==', userId))
const menu = document.getElementById('vehicleTypeMenuFilter');
onSnapshot(VehicleTypeCol, (snapshot) => {
    snapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement('li');
        li.innerHTML = `<a class="dropdown-item" href="#" onclick="filterTable('all', '${data.type}')">${data.type}</a>`;
        menu.appendChild(li);
    })
})

function getDriver(load){
    const driverDocRef = doc(db, 'Driver', load);
    onSnapshot(driverDocRef, (doc) => {

        document.getElementById('Drivername').innerText = `Name: ${doc.get('name')}`;
        document.getElementById('Contact').innerText = `Contact: ${doc.get('phone_number') ?? 'N/A'}`;
        document.getElementById('Email').innerText = `Email: ${doc.get('email') ?? 'N/A'}`;
        document.getElementById('profile_pic').innerHTML = `<img src=${doc.get('profile_pic') == '' ? "https://via.placeholder.com/40" : doc.get('profile_pic')} alt="Dale" width="100" height="100"><br><br><h4 id="Rating">${doc.get('rating').toFixed(1)}</h4><h6 id="Rating">${ratingSummary(doc.get('rating'))}`;
        document.getElementById('Status').innerHTML = `Status: ${doc.get('onlineStatus') == 'online' ? '<span class="badge bg-success">Online</span>' : '<span class="badge bg-danger">Offline</span>'}`;

        var location = doc.get('location');
        initMap(location['geopoint']);
    })
}
function getStatus(data){
    let listStatus = [];
    let val = false;
    listStatus[0] = data.OR_verified;
    listStatus[1] = data.CR_verified;
    listStatus[2] = data.CPC_verified;
    console.log(listStatus);
    console.log(listStatus[0]);
    console.log(listStatus[1]);
    console.log(listStatus[2]);
    if(listStatus[0] && listStatus[1] && listStatus[2]){
        val = true;
    }else{
        val = false;
    }
    console.log(val);
    return val;

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


const documents = new Map();

getDocs(q).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      documents.set(doc.id, doc.data());
    });
    renderItems();
  });

onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "modified") {
        documents.set(change.doc.id, change.doc.data());
      } else if (change.type === "removed") {
        documents.delete(change.doc.id);
      }
    })
    const popupForm1 = document.getElementById('vehicleDetails');
    const itemId = popupForm1.getAttribute('data-id');
    if(itemId!= null){
        const itemData = documents.get(itemId);
        populateForm(itemData, itemId);
    }
    renderItems();
  });


function renderItems(){
    const tablebody = document.querySelector("#vehicleTable tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const row = document.createElement("tr");
        console.log(data);
            getStatus(data) ? row.setAttribute("data-status", 'active') :  row.setAttribute("data-status", 'inactive');
            row.setAttribute('data-type', data.type);
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col7 = document.createElement("td");
    
            col1.innerHTML = `<img src="${data.vehicle_image}" alt="icon-${data.model}" width="50px" height="50px">`;
            col2.innerText = data.type;
            col3.innerText = data.model;
            col4.innerText = data.make;
            col5.innerText = data.plate_num;
            col6.innerHTML = getStatus(data) ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>';
            col7.innerHTML = `<button class="btn btn-success btn-sm viewMore" style="margin-right: 5px" data-id="${id}"><i data-feather="eye"></i></button>`;
            
    
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
    
    document.querySelectorAll(".viewMore").forEach( button => {
        button.addEventListener('click', function(){
          const itemId = this.getAttribute('data-id');
          console.log(itemId);
          const popupForm1 = document.getElementById('vehicleDetails');
          const popupForm1Con = document.getElementById('hide');
          const closeForm = document.getElementById('toClose');
          closeForm.style.display = "none";
          popupForm1.setAttribute('data-id', itemId);
          popupForm1Con.style.display = "block";
          popupForm1.style.display = "flex";

          const itemData = documents.get(itemId);
          populateForm(itemData, itemId);
        })
      })


}
function populateForm(data, id){
    const img = document.getElementById("vehicle-image");
    document.getElementById("verifyOR").setAttribute('data-id', id);
    document.getElementById("verifyCR").setAttribute('data-id', id);
    document.getElementById("verifyCPC").setAttribute('data-id', id);
    img.src = data.vehicle_image;
    document.getElementById("vehicle-model").innerText = `Model: ${data.model}`;
    document.getElementById("vehicle-make").innerText = `Make: ${data.make}`;
    document.getElementById("vehicle-type").innerText = `Type: ${data.type}`;
    document.getElementById("vehicle-plate-num").innerText = `Plate number: ${data.plate_num}`;
    document.getElementById("orUrl").innerHTML = 
    isImageOrPdf(data.OR) == 'Image' ? 
    `<img src=${data.OR == '' ? "https://via.placeholder.com/40" : data.OR} alt="Dale" width="200" height="270">` : 
     `<div style="width:200px; height:272px">${data.OR != '' ? `<a href="${data.OR}" target="_blank" download>View or Download OR</a>` : '<p>Fleet Owner Has not submitted this document.</p>'}</div>`
    ;    
    document.getElementById('ordocStatus').innerHTML = data.OR_verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>';
    document.getElementById("crUrl").innerHTML = 
    isImageOrPdf(data.CR) == 'Image' ? 
    `<img src=${data.CR == '' ? "https://via.placeholder.com/40" : data.CR} alt="Dale" width="200" height="270">` : 
     `<div style="width:200px; height:272px">${data.CR != '' ? `<a href="${data.CR}" target="_blank" download>View or Download CR</a>` : '<p>Fleet Owner Has not submitted this document.</p>'}</div>`
    ;     
    document.getElementById('crdocStatus').innerHTML = data.CR_verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>';
    document.getElementById('expiryDate').innerText = formatTimestampIntl(data.OR_CR_expiry_date);
    document.getElementById('expiryDate2').innerText = formatTimestampIntl(data.OR_CR_expiry_date);
    document.getElementById('expiryDate3').innerText = formatTimestampIntl(data.CPC_expiry_date);
    document.getElementById("cpcUrl").innerHTML = 
    isImageOrPdf(data.CPC) == 'Image' ? 
    `<img src=${data.CPC == '' ? "https://via.placeholder.com/40" : data.CPC} alt="Dale" width="200" height="270">` : 
     `<div style="width:200px; height:272px">${data.CPC != '' ? `<a href="${data.CPC}" target="_blank" download>View or Download CPC</a>` : '<p>Fleet Owner Has not submitted this document.</p>'}</div>`
    ;    
    document.getElementById('cpcdocStatus').innerHTML = data.CPC_verified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>';

}

document.getElementById("verifyOR").onclick = async function(event){
    event.preventDefault();
    const vehicleId = this.getAttribute('data-id');
    const vehicle = doc(db, 'Vehicle', vehicleId);
    await updateDoc(vehicle, {
        "OR_verified": true,
    });
}
document.getElementById("verifyCR").onclick = async function(event){
    event.preventDefault();
    const vehicleId = this.getAttribute('data-id');
    const vehicle = doc(db, 'Vehicle', vehicleId);
    await updateDoc(vehicle, {
        "CR_verified": true,
    });
}

document.getElementById("verifyCPC").onclick = async function(event){
    event.preventDefault();
    const vehicleId = this.getAttribute('data-id');
    const vehicle = doc(db, 'Vehicle', vehicleId);
    await updateDoc(vehicle, {
        "CPC_verified": true,
    });
}
document.getElementById('backButton').onclick = async function(event){
    const popupForm1Con = document.getElementById('hide');
    const popupForm1 = document.getElementById('vehicleDetails');
    const closeForm = document.getElementById('toClose');
    closeForm.style.display = "block";
    popupForm1.removeAttribute('data-id');
    popupForm1Con.style.display = "none";
    popupForm1.style.display = "none";
}



document.getElementById('driverDocsButton').onclick = function(event){
    event.preventDefault();
    window.location.href = `driversIn.html?driverUserId=${userId}#drivers`;
}

document.getElementById('vehiclesButton').onclick = function(event){
    event.preventDefault();
    window.location.href = `vehicles.html?driverUserId=${userId}#drivers`;
}
document.getElementById('activitiesButton').onclick = function(event){
    event.preventDefault();
    window.location.href = `activities.html?driverUserId=${userId}#drivers`;
}
function formatTimestampIntl(timestamp) {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US').format(date);
  }
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
let map;
        let pickupMarker;

        async function initMap(location) {
            const mapCenter = new google.maps.LatLng(location.latitude, location.longitude);
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: mapCenter,
                zoomControl: false,
                mapId: "RouteMap",
            });
    
            const pinBorder = new google.maps.marker.PinElement({
                background: "#39e75f",
                glyphColor: "#006400",
                borderColor: "#006400"
              });

            // Initialize markers
            pickupMarker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: mapCenter,
                title: 'Pickup Location',
                content: pinBorder.element,
            });
        }