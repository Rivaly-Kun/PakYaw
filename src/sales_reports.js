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
    doc 
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

// Main function to fetch and aggregate sales data for all users
async function getAdminSalesReport(db, filterType, customStartDate = null, customEndDate = null) {
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
        let pakyawQuery;
        const vehicleTypesDocs = await getDocs(query(collection(db, 'VehicleType'), where('status', '==', true)));
        vehicleTypesDocs.forEach( doc => {
            vehicleTypes[doc.data().type] = 0;
        })
        if(filterType == '7days' || (customStartDate != null && customEndDate != null)){
            querys = query(
                collection(db, 'daily_earning_summaries'),
                where('user_type', '!=', 'Pakyaw'),
                where('lastUpdated', '>=', startDate),
                where('lastUpdated', '<=', endDate)
            );
            pakyawQuery = query(
                collection(db, 'daily_earning_summaries'),
                where('user_type', '==', 'Pakyaw'),
                where('lastUpdated', '>=', startDate),
                where('lastUpdated', '<=', endDate)
            );
        }else if(filterType == '30days'){
            querys = query(
                collection(db, 'weekly_earning_summaries'),
                where('user_type', '!=', 'Pakyaw'),
                where('startDate', '<=', endDate),
                where('endDate', '>=', startDate)
            );
            pakyawQuery = query(
                collection(db, 'weekly_earning_summaries'),
                where('user_type', '==', 'Pakyaw'),
                where('startDate', '<=', endDate),
                where('endDate', '>=', startDate)
            );
        }else if(filterType == '60days'){
            querys = query(
                collection(db, 'monthly_earning_summaries'),
                where('user_type', '!=', 'Pakyaw'),
                where('lastUpdated', '>=', startDate),
                where('lastUpdated', '<=', endDate)
            );
            pakyawQuery = query(
                collection(db, 'monthly_earning_summaries'),
                where('user_type', '==', 'Pakyaw'),
                where('lastUpdated', '>=', startDate),
                where('lastUpdated', '<=', endDate)
            );
        }

        const querysis = await getDocs(querys);
        const pakyawQuerysis = await getDocs(pakyawQuery);

        // Process each summary (daily, weekly, monthly)
        querysis.forEach(doc => {
            const data = doc.data();
            console.log(doc.data());
            processStats(data, results, vehicleTypes);
        });
        pakyawQuerysis.forEach(doc => {
            const data = doc.data();
            console.log(doc.data());
            processStats2(data, pakyawResults);
        });

        // Prepare the final result as an array
        const finalResults = Array.from(results.values());
        const finalPakyawResults = Array.from(pakyawResults.values());
        const vehicleTypesResults = Object.entries(vehicleTypes).sort((a, b) => b[1]-a[1]);
        console.log(finalResults);
        // Populate the table
        populateTable(finalResults, vehicleTypesResults, finalPakyawResults);

    } catch (error) {
        console.error('Error fetching admin sales report:', error);
    }
}

// Function to process and update user stats
function processStats(data, results, vehicleTypes) {
    if (!results.has(data.user_id)) {
        results.set(data.user_id, {
            user_id: data.user_id,
            user_type: data.user_type,
            totalEarnings: 0,
            tripCount: 0,
            onlineHours: 0,
            categories: {},
            lastUpdate: null
        });
    }

    const userStats = results.get(data.user_id);

    // Process daily, weekly, or monthly stats
    const stats = data.dailyStats || data.weeklyStats || data.monthlyStats;
    userStats.totalEarnings += stats.totalEarnings || 0;
    userStats.tripCount += stats.tripCount || 0;
    userStats.onlineHours += stats.onlineHours || 0;
    userStats.lastUpdate = data.lastUpdated;

    // Aggregate categories
    Object.entries(stats.categories || {}).forEach(([category, amount]) => {
        userStats.categories[category] = (userStats.categories[category] || 0) + amount;
        if(category in vehicleTypes){
            vehicleTypes[category] = vehicleTypes[category] + amount;
        }
    });
}

function processStats2(data, results) {
    if (!results.has(data.user_id)) {
        results.set(data.user_id, {
            user_id: data.user_id,
            user_type: data.user_type,
            totalEarnings: 0,
            tripCount: 0,
            onlineHours: 0,
            categories: {},
            lastUpdate: null
        });
    }

    const userStats = results.get(data.user_id);

    // Process daily, weekly, or monthly stats
    const stats = data.dailyStats || data.weeklyStats || data.monthlyStats;
    userStats.totalEarnings += stats.totalEarnings || 0;
    userStats.tripCount += stats.tripCount || 0;
    userStats.onlineHours += stats.onlineHours || 0;
    userStats.lastUpdate = data.lastUpdated;
}

// Function to create a table row
function createTableRow(userData) {
    console.log(userData.user_id);
    const tr = document.createElement('tr');
    tr.setAttribute('data-status', userData.user_type);
    const date = new Date(userData.lastUpdate.toDate());
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    tr.innerHTML = `
        <td>${userData.user_type == 'driver' ? 'driver' : 'fleetOwner'}-${userData.user_id.substring(0, 8)}</td>
        <td>${userData.user_type}</td>
        <td>₱${userData.totalEarnings.toFixed(2)}</td>
        <td>${userData.tripCount}</td>
        <td>${Object.entries(userData.categories).map(([cat, amt]) => `${cat}: ₱${amt.toFixed(2)}`).join(', ')}</td>
    `;
    return tr;
}

function TryParseInt(str,defaultValue) {
     var retValue = defaultValue;
     if(str !== null) {
         if(str.length > 0) {
             if (!isNaN(str)) {
                 retValue = parseInt(str);
             }
         }
     }
     return retValue;
}

function createRow(data2, places) {
    const tr = document.createElement('tr');
    console.log(places);
    tr.innerHTML = `
        <td style="width: 100px; text-align: center; vertical-align: middle; padding-bottom:0px;padding-top:0px">${TryParseInt(places, 0) == 0 ? `<img src="${places}" style="max-width: 120%; height: 70px; padding:0; !important">` : places}</td>
        <td>${data2[0, 0]}</td>
        <td>₱${data2[0, 1].toFixed(2)}</td>
    `;
    return tr;
}

// Function to populate the table
function populateTable(data, data2, data3) {
    console.log('populateTable');
    const tableBody = document.querySelector('#reportTable tbody');
    const tableBody2 = document.getElementById('performingVTypes');
    tableBody.innerHTML = '';
    tableBody2.innerHTML = '';
    let count = 1;
    const places = ['../../assets/1st-prize.png', '../../assets/2nd-place.png', '../../assets/3rd-place.png']
    console.log(data2.length);
    data3.forEach(user => {
        document.getElementById('totalSales').innerText = "₱" + " " + user.totalEarnings.toFixed(2);
    });
    data.forEach(user => {
        const row = createTableRow(user);
        tableBody.appendChild(row);
    });
    for(let i = 0; i != data2.length; i++){
        const row2 = createRow(data2[i], count <= places.length ? places[i] : count.toString());
        tableBody2.appendChild(row2);
        count++;
    }
}

document.getElementById('7days').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    let option1 = document.getElementById('7days').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');
    getAdminSalesReport(db, '7days');
}
document.getElementById('30days').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    let option1 = document.getElementById('30days').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');
    getAdminSalesReport(db, '30days');
}
document.getElementById('60days').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    let option1 = document.getElementById('60days').innerText;
    status.innerText = option1;
    drop.setAttribute('class', 'dropdown-menu');
    getAdminSalesReport(db, '60days');

}

document.addEventListener("DOMContentLoaded", function() {
    const datePicker = flatpickr("#toDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("toDate").innerText = dateStr;
            const dateFrom = (document.getElementById('fromDate').innerText == 'N/A' ? null : document.getElementById('fromDate').innerText);
            datePicker2.set("maxDate", selectedDates[0]);
            getAdminSalesReport(db, '7days', dateFrom, dateStr);
        },
        positionElement: document.getElementById("toDate"),
    });

    const datePicker2 = flatpickr("#fromDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("fromDate").innerText = dateStr;
            const dateTo = (document.getElementById('toDate').innerText == 'N/A' ? null : document.getElementById('toDate').innerText);
            datePicker.set("minDate", selectedDates[0]);
            getAdminSalesReport(db, '7days', dateStr, dateTo);
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



// Example usage
getAdminSalesReport(db, '7days');
