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
const documents = new Map();

// Function to create and execute query based on date range
function executeQuery(startDate, endDate) {
    // Clear existing documents
    documents.clear();
    
    // Convert dates to midnight for consistent querying
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Create query with date range
    const discountCol = query(
        collection(db, 'AdminLogs'),
        where('actionTime', '>=', start),
        where('actionTime', '<=', end)
    );

    // Set up snapshot listener
    const unsubscribe = onSnapshot(discountCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
                documents.set(change.doc.id, change.doc.data());
            } else if (change.type === "removed") {
                documents.delete(change.doc.id);
            }
        });
        renderTable();
    });

    // Initial data fetch
    getDocs(discountCol).then((querySnapshot) => {
        console.log(querySnapshot.size);
        querySnapshot.forEach((doc) => {
            documents.set(doc.id, doc.data());
        });
        renderTable();
    });

    return unsubscribe;
}

// Keep track of the current snapshot listener
let currentUnsubscribe = null;

document.addEventListener("DOMContentLoaded", function() {
    // Initialize with today's date
    const today = new Date();
    let startDate = today;
    let endDate = today;

    const datePicker = flatpickr("#toDatePicker", {
        defaultDate: today,
        onChange: function(selectedDates, dateStr) {
            document.getElementById("toDate").innerText = dateStr;
            datePicker2.set("maxDate", selectedDates[0]);
            endDate = selectedDates[0];
            
            // Update query when both dates are selected
            if (startDate) {
                if (currentUnsubscribe) {
                    currentUnsubscribe();
                }
                currentUnsubscribe = executeQuery(startDate, endDate);
            }
        },
        positionElement: document.getElementById("toDate"),
    });

    const datePicker2 = flatpickr("#fromDatePicker", {
        defaultDate: today,
        onChange: function(selectedDates, dateStr) {
            document.getElementById("fromDate").innerText = dateStr;
            datePicker.set("minDate", selectedDates[0]);
            startDate = selectedDates[0];
            
            // Update query when both dates are selected
            if (endDate) {
                if (currentUnsubscribe) {
                    currentUnsubscribe();
                }
                currentUnsubscribe = executeQuery(startDate, endDate);
            }
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

    // Initialize query with today's date range
    currentUnsubscribe = executeQuery(today, today);
});

function renderTable() {
    const tablebody = document.querySelector("#ongoingRidesTable tbody");
    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const date = new Date(data.actionTime.toDate());
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const minute = String(date.getMinutes()).padStart(2, '0');
        const hour = String(date.getHours())
        const hour12 = hour % 12 || 12;
        const amOrpm = hour >= 12 ? 'PM' : 'AM';
        
        const row = document.createElement("tr");
        const col1 = document.createElement("td");
        const col2 = document.createElement("td");
        const col3 = document.createElement("td");
        const col4 = document.createElement("td");
        const col5 = document.createElement("td");

        col1.innerText = `Log-${id.substring(0, 8)}`;
        col2.innerText = `User-${data.user_id.substring(0, 8)}`;
        col3.innerText = data.action;
        col4.innerText = data.category;
        col5.innerText = `${month}/${day}/${year} ${hour12}:${minute} ${amOrpm}`;
        
        row.appendChild(col1);
        row.appendChild(col2);
        row.appendChild(col3);
        row.appendChild(col4);
        row.appendChild(col5);
        tablebody.appendChild(row);
    });
    
    feather.replace();
}