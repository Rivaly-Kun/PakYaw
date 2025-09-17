import { initializeApp } from "firebase/app"
import { 
    getFirestore,
    doc, 
    getDoc
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
const tripId = urlParams.get('tripId');    

const tripDoc = await getDoc(doc(db, 'Trips', tripId));
const tripData = tripDoc.data();
if(tripData.driver.driver_name == ''){
    document.getElementById('driverProfile').style.display = 'none';
    document.getElementById('vehicleImg').style.display = 'none';
    document.getElementById('type').style.display = 'none';
    document.getElementById('model').style.display = 'none';
    document.getElementById('n/a').innerText = 'N/A';
}
document.getElementById('driverProfile').setAttribute('src', tripData.driver.driver_profile);
document.getElementById('driverName').innerText = tripData.driver.driver_name != '' ? tripData.driver.driver_name : 'N/A';

document.getElementById('passengerProfile').setAttribute('src', tripData.passenger.passenger_profile);
document.getElementById('passengerName').innerText = tripData.passenger.passenger_name;

document.getElementById('vehicleImg').setAttribute('src', tripData.vehicle.vehicle_image);
document.getElementById('type').innerText = 'Type: ' + tripData.vehicle.vehicle_type;
document.getElementById('model').innerText = 'Model: ' + tripData.vehicle.model;

document.getElementById('rating').innerText = 'Rating: ' + tripData.rating;

document.getElementById('tripId').innerText = 'Trip ID: Trip-' + tripDoc.id.substring(0,8);
document.getElementById('distance').innerText = 'Distance: ' + (tripData.distance > 1 ? tripData.distance + ' km' : (tripData.distance * 1000) + ' m');
document.getElementById('duration').innerText = 'Estimated Duration: ' + getDuration(tripData.duration);
document.getElementById('fare').innerText = 'Fare: ₱' + getFare();
document.getElementById('promo').innerText = 'Promo: ' + tripData.promo.promo_name + ` (${(tripData.promo.discount * 100)}%)`;
document.getElementById('discount').innerText = 'Discount: ' + tripData.discount.discount_name + ` (${tripData.discount.peso == 0 ? `${(tripData.discount.discount * 100)}%` : `₱${(tripData.discount.peso)}`})`;
document.getElementById('paymentMethod').innerText = 'Payment Method: ' + tripData.paymentMethod.payment_method + '(' + tripData.paymentMethod.account_num + ') ';
document.getElementById('status').innerText = 'Status: ' + tripData.status + '\nReason: '+ (tripData.status == 'cancelled' ? tripData.reason : '');
document.getElementById('createdTime').innerText = 'Created Time: ' + getDate();
console.log(tripData.driver_verification_selfie != undefined);
document.getElementById('verSelfie').innerHTML = tripData.driver_verification_selfie != undefined ? `<img src="${tripData.driver_verification_selfie}" style="width: 150px; height: 150px">` : '';
document.getElementById('notes').innerText = 'Notes: \n' + (tripData.notes ?? 'N/A');

function getDate(){
    const date = new Date(tripData.createdTime.toDate());
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function getFare(){
    let discountedFare = tripData.fare - (tripData.fare * tripData.promo.discount);
    let vatTax = discountedFare * tripData.vatTax;
    let cpcTax = discountedFare * tripData.ccTax;
    discountedFare = discountedFare + vatTax + cpcTax;
    return discountedFare.toFixed(2);
}

function getDuration(duration){
    let time = parseInt(duration.replace('s', ''));
    if(time > 60){
        let minute = Math.round(time/60);
        return minute + ' minute/s';
    }else{
        return time + ' seconds';
    }
}

        let map;
        let polyline;
        let pickupMarker;
        let destMarker;
        let isChangedRoute = false;
        let pickupInfoWindow;
        let destInfoWindow;

        function convertGeoPointsToLatLng(geoPoints) {
            return geoPoints.map(geoPoint => ({
                lat: geoPoint.latitude,
                lng: geoPoint.longitude
            }));
        }

        // Sample coordinate data (replace with your actual data)
        const originalRoute = convertGeoPointsToLatLng(tripData.route);
        const changedRoute = tripData.changed_route ? 
            convertGeoPointsToLatLng(tripData.changed_route) : null;

        async function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 12,
                center: originalRoute[Math.floor(originalRoute.length / 2)],
                zoomControl: false,
                mapId: "RouteMap",
            });

            pickupInfoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="width: 220px;">
                        <h5 style="margin: 0 0 5px 0;">Pickup Location</h5>
                        <p style="margin: 0;">Latitude: ${originalRoute[0].lat.toFixed(6)}</p>
                        <p style="margin: 0;">Longitude: ${originalRoute[0].lng.toFixed(6)}</p>
                        ${tripData.pickupAddress ? `<p style="margin: 5px 0 0 0;">Address: ${tripData.pickupAddress}</p>` : ''}
                    </div>
                `
            });
    
            destInfoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="width: 220px;">
                        <h5 style="margin: 0 0 5px 0;">Destination Location</h5>
                        <p style="margin: 0;">Latitude: ${originalRoute[originalRoute.length - 1].lat.toFixed(6)}</p>
                        <p style="margin: 0;">Longitude: ${originalRoute[originalRoute.length - 1].lng.toFixed(6)}</p>
                        ${tripData.dropOffAddress ? `<p style="margin: 5px 0 0 0;">Address: ${tripData.dropOffAddress}</p>` : ''}
                    </div>
                `
            });
    
            const pinBorder = new google.maps.marker.PinElement({
                background: "#39e75f",
                glyphColor: "#006400",
                borderColor: "#006400"
              });

            // Initialize markers
            pickupMarker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: originalRoute[0],
                title: 'Pickup Location',
                content: pinBorder.element,
            });

            destMarker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: originalRoute[originalRoute.length - 1],
                title: 'Destination Location',
            });

            pickupMarker.addListener('click', () => {
                destInfoWindow.close(); // Close other info window if open
                pickupInfoWindow.open(map, pickupMarker);
            });
    
            destMarker.addListener('click', () => {
                pickupInfoWindow.close(); // Close other info window if open
                destInfoWindow.open(map, destMarker);
            });
    
            // Close info windows when clicking on the map
            map.addListener('click', () => {
                pickupInfoWindow.close();
                destInfoWindow.close();
            });

            // Initialize polyline
            polyline = new google.maps.Polyline({
                path: [],
                strokeColor: '#000000',
                strokeWeight: 4
            });
            polyline.setMap(map);

            // Set initial route
            getPolylineFromPoints(originalRoute);

            // Add toggle listener
            const controlsElement = document.querySelector('.controls');

        if (changedRoute) {
            controlsElement.style.display = 'flex'; // Show controls
            
            document.getElementById('routeToggle').addEventListener('change', function(e) {
                isChangedRoute = e.target.checked;
                document.getElementById('routeText').textContent = 
                    isChangedRoute ? 'Changed route' : 'Original route';
                
                    const currentRoute = isChangedRoute ? changedRoute : originalRoute;
                    getPolylineFromPoints(currentRoute);
                    
                    // Update info windows with new coordinates
                    pickupInfoWindow.setContent(`
                        <div style="padding: 10px;">
                            <h3 style="margin: 0 0 5px 0;">Pickup Location</h3>
                            <p style="margin: 0;">Latitude: ${currentRoute[0].lat.toFixed(6)}</p>
                            <p style="margin: 0;">Longitude: ${currentRoute[0].lng.toFixed(6)}</p>
                            ${tripData.pickupAddress ? `<p style="margin: 5px 0 0 0;">Address: ${tripData.pickupAddress}</p>` : ''}
                        </div>
                    `);
                    
                    destInfoWindow.setContent(`
                        <div style="padding: 10px;">
                            <h3 style="margin: 0 0 5px 0;">Destination Location</h3>
                            <p style="margin: 0;">Latitude: ${currentRoute[currentRoute.length - 1].lat.toFixed(6)}</p>
                            <p style="margin: 0;">Longitude: ${currentRoute[currentRoute.length - 1].lng.toFixed(6)}</p>
                            ${tripData.destAddress ? `<p style="margin: 5px 0 0 0;">Address: ${tripData.destAddress}</p>` : ''}
                        </div>
                    `);
            });
        } else {
            controlsElement.style.display = 'none'; // Hide controls
        }
        }

        function getPolylineFromPoints(coordinates) {
            polyline.setPath(coordinates);
            console.log(coordinates[0].lat);
            
            // Update markers
            pickupMarker.position = {lat: coordinates[0].lat, lng: coordinates[0].lng};
            destMarker.position = {lat: coordinates[coordinates.length - 1].lat, lng: coordinates[coordinates.length - 1].lng};
            
            fitPolylineToMap(coordinates);
        }

        function fitPolylineToMap(points) {
            if (points.length === 0) return;

            const bounds = new google.maps.LatLngBounds();
            points.forEach(point => bounds.extend(point));

            // Calculate center point
            const center = points[Math.floor(points.length / 2)];
            
            map.fitBounds(bounds);
            map.panTo(center);

            // Add some padding to the bounds
            map.setZoom(map.getZoom() - 1);
        }
initMap();