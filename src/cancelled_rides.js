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

// Utility function to get date ranges
const getDateRange = (filterType) => {
    const now = new Date();
    const end = new Date(now.setHours(23, 59, 59, 999));
    let start = new Date(now);

    switch (filterType) {
        case 'Today':
            start.setDate(start.getDate());
            break;
        case '7days':
            start.setDate(start.getDate() - 7);
            break;
        case '30days':
            start.setDate(start.getDate() - 30);
            break;
        case '60days':
            start.setDate(start.getDate() - 60);
            break;
        default:
            throw new Error('Invalid filter type');
    }
    
    start.setHours(0, 0, 0, 0);
    return { start, end };
};

async function getAdminCompletedRides(db, filterType, customStartDate = null, customEndDate = null) {
    let startDate, endDate;
    
    if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
    } else {
        const dateRange = getDateRange(filterType);
        startDate = dateRange.start;
        endDate = dateRange.end;
    }

    const results = new Map();
    const pakyawResults = new Map();
    let vehicleTypes = {};
    
    try {
        let querys;
        if(filterType == 'Today' || (customStartDate != null && customEndDate != null)){
            querys = query(
                collection(db, 'Trips'),
                where('status', '==', 'cancelled'),
                where('createdTime', '>=', startDate),
                where('createdTime', '<=', endDate),
                orderBy('createdTime', 'desc')
            );
        }else if(filterType == '7days'){
            querys = query(
                collection(db, 'Trips'),
                where('status', '==', 'cancelled'),
                where('createdTime', '>=', startDate),
                where('createdTime', '<=', endDate),
                orderBy('createdTime', 'desc')
            );
        }else if(filterType == '30days'){
            querys = query(
                collection(db, 'Trips'),
                where('status', '==', 'cancelled'),
                where('createdTime', '>=', startDate),
                where('createdTime', '<=', endDate),
                orderBy('createdTime', 'desc')
            );
        }else if(filterType == '60days'){
            querys = query(
                collection(db, 'Trips'),
                where('status', '==', 'cancelled'),
                where('createdTime', '>=', startDate),
                where('createdTime', '<=', endDate),
                orderBy('createdTime', 'desc')
            );
        }

        const querysis = await getDocs(querys);

        // Process each summary (daily, weekly, monthly)
        querysis.forEach(doc => {
            const data = doc.data();
            processStats(data, results, doc.id);
        });

        // Prepare the final result as an array
        const finalResults = Array.from(results.values());
        console.log(finalResults);
        // Populate the table
        populateTable(finalResults);

    } catch (error) {
        console.error('Error fetching admin sales report:', error);
    }
}

function processStats(data, results, id) {
    if (!results.has(id)) {
        results.set(id, {
            id: id,
            driver: data.driver.driver_name,
            passenger: data.passenger.passenger_name,
            destination: data.changedDropOffAddress != '' ? data.changedDropOffAddress : data.dropOffAddress,
            reason: data.reason,
            date: data.createdTime,
            fare: data.fare,
            promo: data.promo.discount,
            vat_tax: data.vatTax,
            common_carrier_tax: data.ccTax,
        });
    }

    const userStats = results.get(id);
}

function createTableRow(userData) {
    const tr = document.createElement('tr');
    const date = new Date(userData.date.toDate());
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let discountedFare = userData.fare - (userData.fare * userData.promo);
    let vatTax = discountedFare * userData.vat_tax;
    let cpcTax = discountedFare * userData.common_carrier_tax;
    discountedFare = discountedFare + vatTax + cpcTax;
    tr.innerHTML = `
        <td>Trip-${userData.id.substring(0, 8)}</td>
        <td>${userData.driver != '' ? userData.driver : 'N/A'}</td>
        <td>${userData.passenger}</td>
        <td>${userData.destination}</td>
        <td>${month}/${day}/${year}</td>
        <td>${userData.reason}</td>
        <td><button class="btn btn-success viewMore" data-id="${userData.id}"><i data-feather="eye"></i></button></td>
    `;
    return tr;
}

// Function to populate the table
function populateTable(data) {
    console.log('populateTable');
    const tableBody = document.querySelector('#cancelledRidesTable tbody');
    tableBody.innerHTML = '';
    data.forEach(user => {
        const row = createTableRow(user);
        tableBody.appendChild(row);
    });
    feather.replace();
}

document.getElementById('Today').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    let option1 = document.getElementById('Today').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');
    getAdminCompletedRides(db, 'Today');
}

document.getElementById('7days').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    let option1 = document.getElementById('7days').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');
    getAdminCompletedRides(db, '7days');
}
document.getElementById('30days').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    let option1 = document.getElementById('30days').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');
    getAdminCompletedRides(db, '30days');
}
document.getElementById('60days').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    let option1 = document.getElementById('60days').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');
    getAdminCompletedRides(db, '60days');

}

document.addEventListener("DOMContentLoaded", function() {
    const datePicker = flatpickr("#toDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("toDate").innerText = dateStr;
            const dateFrom = (document.getElementById('fromDate').innerText == 'N/A' ? null : document.getElementById('fromDate').innerText);
            datePicker2.set("maxDate", selectedDates[0]);
            getAdminCompletedRides(db, '7days', dateFrom, dateStr);
        },
        positionElement: document.getElementById("toDate"),
    });

    const datePicker2 = flatpickr("#fromDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("fromDate").innerText = dateStr;
            const dateTo = (document.getElementById('toDate').innerText == 'N/A' ? null : document.getElementById('toDate').innerText);
            datePicker.set("minDate", selectedDates[0]);
            getAdminCompletedRides(db, '7days', dateStr, dateTo);
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

document.querySelector('table').addEventListener('click', function(e) {
    if (e.target.classList.contains('viewMore')) {
        const itemId = e.target.getAttribute('data-id');
        console.log(itemId);
        window.location.href = `../../trip.html?tripId=${itemId}#trip`;
    }
});

getAdminCompletedRides(db, 'Today');