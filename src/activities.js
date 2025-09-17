
import { initializeApp } from "firebase/app"
import { 
    getFirestore,
    collection, 
    query, 
    where, 
    getCountFromServer,
    Timestamp,
    onSnapshot,
    getDoc,
    getDocs,
    updateDoc,
    doc, 
    orderBy
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

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const userId = urlParams.get('driverUserId');

getDriver(userId);

const driverVehiclesCol = collection(db, 'Vehicle');
const q = query(driverVehiclesCol, where('driver.driver_id', '==', userId))

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

        // Cleanup on page unload
window.addEventListener('unload', () => {
    dashboard.destroy();
});

const today = new Date();
let starting = new Date(today);
starting.setHours(0, 0, 0, 0);
let end = new Date(today.setHours(23, 59, 59, 999));
const documents = new Map();

function getData(){
console.log(starting);
console.log(end);
const discountCol = query(collection(db, 'Trips'),
where('driver.driver_id', '==', userId),
where('createdTime', '>=', starting),
where('createdTime', '<=', end),);
getDocs(discountCol).then((querySnapshot) => {
  console.log(querySnapshot.size);
    querySnapshot.forEach((doc) => {
        documents.set(doc.id, doc.data());
    });
    console.log('size: ' + querySnapshot.size);
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
  console.log('size: ' + snapshot.size);
  renderTable();
});
}
function getTripState(status){
  if(status == 'ongoing'){
    return '<span class="badge bg-warning">Ongoing</span>';
  }else if(status == 'cancelled'){
    return '<span class="badge bg-danger">Cancelled</span>';
  }else if(status == 'completed'){
    return '<span class="badge bg-success">Completed</span>';
  }
}
function getTripState2(status){
  if(status == 'ongoing'){
    return 'ongoing';
  }else if(status == 'cancelled'){
    return 'cancelled';
  }else if(status == 'completed'){
    return 'completed';
  }
}
function renderTable(){
    const tablebody = document.querySelector("#activitiesRidesTable tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const date = new Date(data.createdTime.toDate());
        const day = String(date.getMinutes()).padStart(2, '0');
        const month = String(date.getHours());
        const hour12 = month % 12 || 12;
        const amOrpm = month >= 12 ? 'PM' : 'AM';
        const date2 = new Date(data.createdTime.toDate());
    const day2 = String(date2.getDate()).padStart(2, '0');
    const month2 = String(date2.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
        let discountedFare = data.fare - (data.fare * data.promo.discount);
        let vatTax = discountedFare * data.vatTax;
        let cpcTax = discountedFare * data.ccTax;
        discountedFare = discountedFare + vatTax + cpcTax;
        const row = document.createElement("tr");
        row.setAttribute('data-status', getTripState2(data.status));
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col3 = document.createElement("td");
            const col4 = document.createElement("td");
            const col5 = document.createElement("td");
            const col6 = document.createElement("td");
            const col7 = document.createElement("td");
            const col8 = document.createElement("td");
    
            col1.innerText = "Trip-" + id.substring(0, 8);
            col2.innerText = data.driver.driver_name;
            col3.innerText = data.passenger.passenger_name;
            col4.innerText = data.changedDropOffAddress != '' ? data.changedDropOffAddress : data.dropOffAddress;
            col5.innerText = `${month2}/${day2}/${year} ${String(hour12).padStart(2, '0')}:${day} ${amOrpm}`;
            col6.innerText = '₱' + ' ' + discountedFare.toFixed(2);
            col7.innerHTML = getTripState(data.status);
            col8.innerHTML = `<button type="button" class="btn btn-success viewMore" data-id="${id}"><i data-feather="eye"></i></button>`;
            
    
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col3);
            row.appendChild(col4);
            row.appendChild(col5);
            row.appendChild(col6);
            row.appendChild(col7);
            row.appendChild(col8);
            tablebody.appendChild(row);
    })
    feather.replace();
}

document.querySelector('table').addEventListener('click', function(e) {
    if (e.target.classList.contains('viewMore')) {
        const itemId = e.target.getAttribute('data-id');
        console.log(itemId);
        window.location.href = `/system/trip.html?tripId=${itemId}#trip`;
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const datePicker = flatpickr("#toDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("toDate").innerText = dateStr;
            const dateFrom = (document.getElementById('fromDate').innerText == 'N/A' ? null : document.getElementById('fromDate').innerText);
            datePicker2.set("maxDate", selectedDates[0]);
            end = new Date(dateStr);
            getData();
        },
        positionElement: document.getElementById("toDate"),
    });

    const datePicker2 = flatpickr("#fromDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("fromDate").innerText = dateStr;
            const dateTo = (document.getElementById('toDate').innerText == 'N/A' ? null : document.getElementById('toDate').innerText);
            datePicker.set("minDate", selectedDates[0]);
            starting = new Date(dateStr);
            getData();
        },
        positionElement: document.getElementById("fromDate"),
    });

    document.getElementById("toDate").onclick = function(event) {
        event.preventDefault();
        datePicker.open();
    }
    document.getElementById("fromDate").onclick = function(event) {
        event.preventDefault();
        datePicker2.open();
    }
});

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