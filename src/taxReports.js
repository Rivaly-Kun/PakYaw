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

async function populateEarningsTables(dateFilter) {
    // Determine date range
    const dateRange = calculateDateRange(dateFilter);
    
    // Query daily earnings
    const earningsQuery = query(
        collection(db, 'daily_earning_summaries'),
        where('user_type', '==', 'Pakyaw'),
        where('lastUpdated', '>=', dateRange.start),
        where('lastUpdated', '<=', dateRange.end)
    );

    try {
        const querySnapshot = await getDocs(earningsQuery);
        
        // Aggregate earnings data
        let totalRideEarnings = 0;
        let totalPromoDiscounts = 0;
        let totalVatAmount = 0;
        let totalCCTAmount = 0;
        let vatRate = 0;
        let cctRate = 0;
        let totalRides = 0;
        let totalFares = 0;
        let minusVat = 0;
        let minusVatRide = 0;
        let minusCct = 0;
        let minusCctRide = 0;
        let commisionfee = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Accumulate earnings
            totalRideEarnings += data.dailyStats.totalFare == undefined ? 0 : data.dailyStats.totalFare;
            commisionfee += data.dailyStats.totalEarnings;
            totalPromoDiscounts += (data.dailyStats.promos == undefined ? 0 : data.dailyStats.promos + data.dailyStats.discount == undefined ? 0 : data.dailyStats.discount);
            totalVatAmount += data.dailyStats.taxes == undefined ? 0.0 : data.dailyStats.taxes.vatTax;
            totalCCTAmount += data.dailyStats.taxes == undefined ? 0.0 : data.dailyStats.taxes.commonCarrierTax;
            vatRate = data.vatTaxRate == undefined ? 0 : data.vatTaxRate;
            cctRate = data.commonCarrierTaxRate == undefined ? 0 : data.commonCarrierTaxRate;
            totalRides += data.dailyStats.tripCount;
            totalFares += data.dailyStats.totalFare == undefined ? 0 : data.dailyStats.totalFare;
        });
        minusVat = totalPromoDiscounts * (vatRate / 100);
        minusVatRide = totalRideEarnings * (vatRate / 100);
        minusCct = totalPromoDiscounts * (cctRate / 100);
        minusCctRide = totalRideEarnings * (cctRate / 100);
        // Calculate net amounts
        const netVatableAmount = totalRideEarnings - totalPromoDiscounts;
        const netCCTAmount = totalRideEarnings - totalPromoDiscounts;

        document.getElementById('totalRides').innerText = totalRides;
        document.getElementById('totalFares').innerText = '₱' + totalFares.toFixed(2);

        // Populate VAT Table
        const vatTable = document.getElementById('reportTable');
        const vatRows = vatTable.querySelectorAll('tbody tr');
        vatRows[0].innerHTML = `
            <td>Total Ride Earnings</td>
            <td>${totalRideEarnings.toFixed(2)}</td>
            <td>${vatRate}%</td>
            <td>${minusVatRide.toFixed(2)}</td>
        `;

        vatRows[1].innerHTML = `
            <td>Promotions & Discounts</td>
            <td>-${totalPromoDiscounts.toFixed(2)}</td>
            <td>${vatRate}%</td>
            <td>-${minusVat.toFixed(2)}</td>
        `;
        
        vatRows[2].innerHTML = `
            <td>Net VATable Amount</td>
            <td>${netVatableAmount.toFixed(2)}</td>
            <td>-</td>
            <td>${(minusVatRide - minusVat).toFixed(2)}</td>
        `;
        
        vatRows[3].innerHTML = `
            <td>Total Vat Payable</td>
            <td>-</td>
            <td>-</td>
            <td>${(minusVatRide - minusVat).toFixed(2)}</td>
        `;

        // Populate Common Carrier Tax Table
        const cctTable = document.getElementById('reportTable2');
        const cctRows = cctTable.querySelectorAll('tbody tr');
        cctRows[0].innerHTML = `
            <td>Total Ride Earnings</td>
            <td>${totalRideEarnings.toFixed(2)}</td>
            <td>${cctRate}%</td>
            <td>${minusCctRide.toFixed(2)}</td>
        `;
        
        cctRows[1].innerHTML = `
            <td>Promotions & Discounts</td>
            <td>-${totalPromoDiscounts.toFixed(2)}</td>
            <td>${cctRate}%</td>
             <td>-${minusCct.toFixed(2)}</td>
        `;
        
        cctRows[2].innerHTML = `
            <td>Net Common Carrier Tax Amount</td>
            <td>${netCCTAmount.toFixed(2)}</td>
            <td>-</td>
            <td>${(minusCctRide - minusCct).toFixed(2)}</td>
        `;
        
        cctRows[3].innerHTML = `
            <td>Total Common Carrier Tax Payable</td>
            <td>-</td>
            <td>-</td>
            <td>${(minusCctRide - minusCct).toFixed(2)}</td>
        `;

    } catch (error) {
        console.error("Error fetching earnings data: ", error);
    }
}

function calculateDateRange(dateFilter) {
    const now = new Date();
    const year = now.getFullYear();
    
    switch(dateFilter) {
        case 'Q1': return { start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`) };
        case 'Q2': return { start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`) };
        case 'Q3': return { start: new Date(`${year}-07-01`), end: new Date(`${year}-09-30`) };
        case 'Q4': return { start: new Date(`${year}-10-01`), end: new Date(`${year}-12-31`) };
        default: 
            return { start: dateFilter.start, end: dateFilter.end };
    }
}

document.getElementById('Q1').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    status.innerText = 'Quarter 1';
    drop.setAttribute('class', 'dropdown-menu');
    populateEarningsTables('Q1');
}
document.getElementById('Q2').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    status.innerText = 'Quarter 2';
    drop.setAttribute('class', 'dropdown-menu');
    populateEarningsTables('Q2');
}
document.getElementById('Q3').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    status.innerText = 'Quarter 3';
    drop.setAttribute('class', 'dropdown-menu');
    populateEarningsTables('Q3');

}
document.getElementById('Q4').onclick = function(event){
    event.preventDefault();
    let drop = document.getElementById('Range');
    let status = document.getElementById('range');
    status.innerText = 'Quarter 4';
    drop.setAttribute('class', 'dropdown-menu');
    populateEarningsTables('Q4');

}
document.addEventListener("DOMContentLoaded", function() {
    const datePicker = flatpickr("#toDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("toDate").innerText = dateStr;
            const dateFrom = (document.getElementById('fromDate').innerText == 'N/A' ? null : document.getElementById('fromDate').innerText);
            datePicker2.set("maxDate", selectedDates[0]);
            const dateFilter = {
                start: new Date(dateFrom),
                end: new Date(dateStr)
            }
            populateEarningsTables(dateFilter);
        },
        positionElement: document.getElementById("toDate"),
    });

    const datePicker2 = flatpickr("#fromDatePicker", {
        onChange: function(selectedDates, dateStr) {
            document.getElementById("fromDate").innerText = dateStr;
            const dateTo = (document.getElementById('toDate').innerText == 'N/A' ? null : document.getElementById('toDate').innerText);
            datePicker.set("minDate", selectedDates[0]);
            const dateFilter = {
                start: new Date(dateStr),
                end: new Date(dateTo)
            }
            populateEarningsTables(dateFilter);
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
populateEarningsTables('Q4');
// Usage
// populateEarningsTables(firestore, 'user123', 'Q1');