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
    orderBy,
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
        // Cleanup on page unload
window.addEventListener('unload', () => {
    dashboard.destroy();
});

const today = new Date();
let end = new Date(today.setHours(23, 59, 59, 999));
const starting = new Date(today);
starting.setHours(0, 0, 0, 0);
console.log(starting);
const discountCol = query(collection(db, 'Trips'),
where('createdTime', '>=', starting),
where('createdTime', '<=', end), orderBy('createdTime', 'desc'));
const driversCol = query(collection(db, 'UserReports'), where('createdAt', '>=', starting),
where('createdAt', '<=', end), orderBy('createdAt', 'desc'));
const documents = new Map();

getDocs(discountCol).then((querySnapshot) => {
  console.log(querySnapshot.size);
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
const documents2 = new Map();
getDocs(driversCol).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      documents2.set(doc.id, doc.data());
    });
    console.log(querySnapshot.size);
    renderItems();
  });

    onSnapshot(driversCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              documents2.set(change.doc.id, change.doc.data());
              } else if (change.type === "removed") {
                documents2.delete(change.doc.id);
              }
        })
        renderItems();
    })

function renderItems(){
  const display = document.getElementById('userReports');
  display.innerHTML = '';
  documents2.forEach((data, id) => {
    const item = document.createElement('div');
    item.innerHTML = `
      <div class="${displaySeverity(data.severity)}" style="border: 1px #dee2e6 solid; border-radius: 5px; margin: 15px; margin-top: 10px; margin-bottom: 0px;">
                                        <div class="card-header ${displaySeverity(data.severity)}" style="padding: 10px; padding-bottom: 10px;">
                                            <div class="d-flex">
                                                <h5>${data.tag}</h5>
                                            </div>
                                            <div class="d-flex" style="border-bottom: 1px #dee2e6 solid; padding-bottom: 5px;">
                                                <p style="cursor: pointer; margin-bottom: 0px;" class="${data.user_type}">User: ${capitalizeFirstLetter(data.user_type)}-${data.user_id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div class="card-body" style="padding: 10px; padding-top: 0px; padding-bottom: 10px;">
                                            <p>Message: ${data.message}</p>
                                            <div class="modal-footer">
                                                <p onclick="window.location.href = 'message.html'" style="cursor: pointer;">See all</p>
                                            </div>
                                        </div>
                                    </div>
    `;
    display.appendChild(item);
  })

}

document.querySelector('#userReports').addEventListener('click', function(e){
  const targetButton = e.target.closest('p'); 
  if(targetButton.classList.contains('driver')){
    window.location.href = 'file maintainance/drivers.html';
  }else if(targetButton.classList.contains('fleetowner')){
    window.location.href = 'file maintainance/fleetOwner.html';
  }else if(targetButton.classList.contains('passenger')){
    window.location.href = 'file maintainance/Passenger.html';
  }
});
function getTripState(status){
  if(status == 'ongoing'){
    return '<span class="badge bg-warning">Ongoing</span>';
  }else if(status == 'cancelled'){
    return '<span class="badge bg-danger">Cancelled</span>';
  }else if(status == 'completed'){
    return '<span class="badge bg-success">Completed</span>';
  }else if(status == 'pending'){
    return '<span class="badge bg-light">Pending</span>';
  }else if(status == 'accepted'){
    return '<span class="badge bg-info">Accepted</span>';
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

    const tablebody = document.querySelector("#todaysRidesTable tbody");

    tablebody.innerHTML = '';

    documents.forEach((data, id) => {
        const date = new Date(data.createdTime.toDate());
        const day = String(date.getMinutes()).padStart(2, '0');
        const month = String(date.getHours());
        const hour12 = month % 12 || 12;
        const amOrpm = month >= 12 ? 'PM' : 'AM';
        let discountedFare = data.fare - (data.fare * data.promo.discount);
        let vatTax = discountedFare * data.vatTax;
        let cpcTax = discountedFare * data.ccTax;
        discountedFare = discountedFare + vatTax + cpcTax;
        const row = document.createElement("tr");
        row.setAttribute('data-status', getTripState2(data.status));
            const col1 = document.createElement("td");
            const col2 = document.createElement("td");
            const col4 = document.createElement("td");
            const col7 = document.createElement("td");
            const col8 = document.createElement("td");
    
            col1.innerText = "Trip-" + id.substring(0, 8);
            col2.innerText = data.driver.driver_name != '' ? data.driver.driver_name : 'N/A';
            col4.innerText = data.changedDropOffAddress != '' ? data.changedDropOffAddress : data.dropOffAddress;
            col7.innerHTML = getTripState(data.status);
            col8.innerHTML = `<button type="button" class="btn btn-success viewMore" data-id="${id}"><i data-feather="eye"></i></button>`;
            
    
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col4);
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
  
  class Dashboard {
    constructor(db) {
      this.db = db;
      this.tripStats = {
        completed: 0,
        ongoing: 0,
        cancelled: 0,
        total: 0
      };
      this.salesStats = null;
      this.unsubscribeOngoing = null;
    }
  
    async getTripsStats(startDate, endDate) {
      const tripsRef = collection(db, 'Trips');
      const tripsQuery = query(tripsRef,
        where('createdTime', '>=', startDate),
        where('createdTime', '<=', endDate)
      );
  
      try {
        // Get status counts in parallel
        const [completedSnapshot, ongoingSnapshot, cancelledSnapshot] = 
          await Promise.all([
            getCountFromServer(
              query(tripsRef,
                where('status', '==', 'completed'),
                where('createdTime', '>=', startDate),
                where('createdTime', '<=', endDate)
              )
            ),
            getCountFromServer(
              query(tripsRef, where('status', '==', 'ongoing'))
            ),
            getCountFromServer(
              query(tripsRef,
                where('status', '==', 'cancelled'),
                where('createdTime', '>=', startDate),
                where('createdTime', '<=', endDate)
              )
            )
          ]);
  
        return {
          completed: completedSnapshot.data().count,
          ongoing: ongoingSnapshot.data().count,
          cancelled: cancelledSnapshot.data().count
        };
      } catch (error) {
        console.error('Error getting trips stats:', error);
        throw error;
      }
    }
  
    async getSalesStats(startDate, endDate) {
      try {
        const inReports = collection(db, 'UserReports');
        const reports = await getCountFromServer(query(inReports, 
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)));
          return reports.data().count;
      } catch (error) {
        console.error('Error getting sales stats:', error);
        throw error;
      }
    }
  
    // Update UI elements
    updateUI(tripStats, salesStats) {
      // Update completed trips
      document.getElementById('completed-rides').innerText = 
        `${tripStats.completed}`;
      
      // Update ongoing trips
      document.getElementById('ongoing-rides').innerText = 
        `${tripStats.ongoing}`;
      
      // Update cancelled trips
      document.getElementById('cancelled-rides').innerText = 
        `${tripStats.cancelled}`;

      document.getElementById('total-sales').innerText = 
        `${salesStats}`;
    }
  
    // Start dashboard monitoring
    async initialize() {
      try {
        // Set up real-time listener for ongoing trips
        const tripsRef = collection(db, 'Trips');
        const ongoingQuery = query(tripsRef, where('status', '==', 'ongoing'));
        
        this.unsubscribeOngoing = onSnapshot(ongoingQuery, 
          (snapshot) => {
            this.tripStats.ongoing = snapshot.size;
            document.getElementById('ongoing-rides').innerText = 
              `${snapshot.size}`;
        });
  
        // Get initial stats
        await this.refreshStats();
  
        // Set up periodic refresh
        this.startPeriodicRefresh();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        document.getElementById('error-message').textContent = 
          'Error loading dashboard data';
      }
    }
  
    async refreshStats() {
      try {
        const endDate = Timestamp.now();
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0); 
        const startDate = Timestamp.fromDate(startOfToday);
  
        const [trips, sales] = await Promise.all([
          this.getTripsStats(startDate, endDate),
          this.getSalesStats(startDate, endDate)
        ]);
  
        this.tripStats = trips;
        this.salesStats = sales;
        this.updateUI(this.tripStats, this.salesStats);
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    }
  
    startPeriodicRefresh() {
      // Refresh every 5 minutes
      setInterval(() => this.refreshStats(), 3 * 60 * 1000);
    }
  
    // Cleanup
    destroy() {
      if (this.unsubscribeOngoing) {
        this.unsubscribeOngoing();
      }
    }
  }
  function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }
  function displaySeverity(num){
    if(num >= 4){
      return 'bg-danger';
    }else if(num >= 2){
      return 'bg-warning';
    }
  }
const dashboard = new Dashboard(db);
dashboard.initialize();