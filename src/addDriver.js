import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithCredential,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  query,
  limit,
  onSnapshot,
  getDocs,
  where,
  addDoc,
  setDoc,
  getDoc,
  Timestamp,
  GeoPoint,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA6_3d88atEhHcUA0UjDsLxzZ0pEhJgA9c",
  authDomain: "ride-hailing-app-68e81.firebaseapp.com",
  projectId: "ride-hailing-app-68e81",
  storageBucket: "ride-hailing-app-68e81.appspot.com",
  messagingSenderId: "704173359839",
  appId: "1:704173359839:web:84bc81ebbc2253b8fb5f6a",
  measurementId: "G-SGV6EXYW9M",
};

initializeApp(firebaseConfig);
const auth = getAuth();
let userId = "";
const filenameAndPath = {};
let isCreatingDriver = false;
let dataAdmin;
onAuthStateChanged(auth, (user) => {
  if (!isCreatingDriver) {
    userId = user?.uid;
    storeDataAdmin();
  }
});
let recaptchaVerifier;

document.addEventListener("DOMContentLoaded", () => {
  try {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: (response) => {
          console.log("reCAPTCHA verified");
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired, please try again.");
        },
      });
    }
    recaptchaVerifier.render();
  } catch (error) {
    console.error("Error initializing reCAPTCHA:", error);
  }
});

const db = getFirestore();
const driverReqCol = collection(db, "DriverDocumentRequirements");
async function storeDataAdmin() {
  const docRef = doc(db, "Admin", userId);
  dataAdmin = await getDoc(docRef);
}

const documents = new Map();

getDocs(driverReqCol).then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    documents.set(doc.id, doc.data());
    console.log("yessaaa");
  });
  renderTable(documents);
  console.log("yess");
});
onSnapshot(driverReqCol, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added" || change.type === "modified") {
      documents.set(change.doc.id, change.doc.data());
      console.log("yessaa");
    } else if (change.type === "removed") {
      documents.delete(change.doc.id);
      console.log("yessa");
    }
  });
  renderTable(documents);
  console.log("yess");
});

function renderTable(documents) {
  const container = document.getElementById("driverRequirements");
  container.innerHTML = "";
  for (const [id, data] of documents) {
    const item = document.createElement("div");
    item.innerHTML = `<div style="box-shadow: none;" class="card">
                                    <div class="card-header  d-flex justify-content-between align-items-center">
                                        <div class="d-flex">
                                            <h4>${id}</h4>
                                        </div>
                                    </div>
                                    <div class="card-body" id="${id}">
                                        <div style="width: 25%;">
                                            <h6>File/Image</h6>
                                            <input class="form-control form-control-sm" id="file-selector_${id}" type="file" required>
                                        </div>
                                        <div class="row" style="margin-top: 12px;">
                                            ${
                                              data.Identification
                                                ? `<div class="col-sm-4">
                                                <h6>Identification</h6>
                                                <input class="form-control form-control-sm" id="identification-${id}" type="text" required>
                                            </div>`
                                                : ""
                                            }
                                            ${
                                              data.IssuanceDate
                                                ? `<div class="col-sm-4">
                                                <h6>Issuance Date</h6>
                                                <input class="form-control form-control-sm issuanceDate" id="issuance-${id}" type="date" id="issuanceDate" placeholder="Default Input" required>
                                            </div>`
                                                : ""
                                            }
                                            ${
                                              data.ExpiryDate
                                                ? `<div class="col-sm-4">
                                                <h6>Expiry Date</h6>
                                                <input class="form-control form-control-sm expiryDate" id="expiry-${id}" type="date" id="expiryDate" placeholder="Small Input" required>
                                            </div>`
                                                : ""
                                            }
                                        </div>
                                    </div>
                                </div>`;

    container.appendChild(item);
    const fileInput = document.getElementById(`file-selector_${id}`);
    fileInput.onchange = () => {
      filenameAndPath[id] = {
        fileNamePath: fileInput.files[0].name,
        fileName: fileInput.files[0],
      };
      console.log(filenameAndPath);
    };
  }
  feather.replace();
  const today = new Date();
  const newDay = new Date();
  newDay.setDate(today.getDate() + 30);

  // Set the min attribute of the date input to today's date
  document.querySelectorAll(".expiryDate").forEach((val) => {
    val.setAttribute("min", newDay.toISOString().split("T")[0]);
  });
  document.querySelectorAll(".issuanceDate").forEach((val) => {
    val.setAttribute("max", today.toISOString().split("T")[0]);
  });
}

function showPromptDialog() {
  document.getElementById("danger").showModal();

  // Return a promise that will be resolved or rejected based on the user's action
  return new Promise((resolve, reject) => {
    // Define handlers for the dialog actions
    document.getElementById("confirmOTP").onclick = function (event) {
      event.preventDefault();
      const userInput = document.getElementById("OTP").value;
      document.getElementById("danger").closest("dialog").close();
      resolve(userInput);
    };
  });
}

document.getElementById("createDriver").onclick = async function (event) {
  event.preventDefault();
  let docu = {};
  const vehicle = {
    vehicle_id: "",
    vehicle_type: "",
    model: "",
    plate_num: "",
    vehicle_image: "",
    fleet_id: "",
    isVat: false,
    percent_taken: 0.0,
  };
  const location = {
    geohash: "",
    geopoint: new GeoPoint(0.0, 0.0),
  };

  const form = document.getElementById("createDriverForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    let firstname = document.getElementById("Firstname").value;
    let lastname = document.getElementById("Lastname").value;
    let phone = document.getElementById("phone").value;
    if (await checkDuplicate(firstname, lastname, "+63" + phone)) {
      document.getElementById("danger2").showModal();
      return;
    }
    let userCredential;

    // Check which sign-in method is active

    if (phone != "") {
      try {
        // Format phone number to include country code
        const formattedPhone = `+63${phone}`;

        // Ensure recaptchaVerifier is initialized
        if (!recaptchaVerifier) {
          throw new Error("reCAPTCHA not initialized");
        }
        console.log("recaptchaVerifier:", recaptchaVerifier);
        console.log("hello world");
        // Send the OTP code to the phone number
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          recaptchaVerifier
        );
        console.log("this is world");
        // Prompt the user to enter the verification code
        const verificationCode = await showPromptDialog();

        if (!verificationCode) {
          throw new Error("Verification code not provided");
        }

        // Verify the code
        isCreatingDriver = true;
        userCredential = await confirmationResult.confirm(verificationCode);
        console.log("Phone number verified successfully");
      } catch (error) {
        console.error("Error during phone sign-in:", error);
        alert(`Authentication failed: ${error.message}`);
        return;
      }
    } else {
      throw new Error("No valid authentication method selected");
    }

    // Proceed only if we have a valid userCredential
    if (!userCredential?.user) {
      throw new Error("Authentication failed - no user credential");
    }

    // Upload files and create user document
    const userDocRef = doc(db, "Driver", userCredential.user.uid);
    const subCol = collection(userDocRef, "PaymentMethods");
    const subCol2 = collection(userDocRef, "DriversDocuments");
    const storage = getStorage();

    // Upload files
    for (const [id, { fileNamePath, fileName }] of Object.entries(
      filenameAndPath
    )) {
      const storageRef = ref(
        storage,
        `driverDocs/${userCredential.user.uid}_${id}_${fileNamePath}`
      );
      await uploadBytes(storageRef, fileName);
      const downloadURL = await getDownloadURL(storageRef);
      docu[id] = {
        URL: downloadURL,
        Verified: false,
        Identification: documents.get(id).Identification
          ? document.getElementById(`identification-${id}`).value
          : null,
        IssuanceDate: documents.get(id).IssuanceDate
          ? Timestamp.fromDate(
              new Date(document.getElementById(`issuance-${id}`).value)
            )
          : null,
        ExpiryDate: documents.get(id).ExpiryDate
          ? Timestamp.fromDate(
              new Date(document.getElementById(`expiry-${id}`).value)
            )
          : null,
      };
      await addDoc(collection(db, "Notifications"), {
        user_id: userCredential.user.uid,
        message: `${firstname} ${lastname} submitted ${id} document for verification.`,
        resolved: false,
        createdAt: Timestamp.now(),
      });
    }

    // Create user document
    await setDoc(userDocRef, {
      search_id: userCredential.user.uid.substring(0, 8),
      profile_pic: "",
      name: `${firstname} ${lastname}`,
      first_name: firstname,
      last_name: lastname,
      email: "",
      phone_number: "+63" + phone,
      fleet_id: "",
      fleet_name: "",
      rating: 0.0,
      ratingCount: 1,
      totalRating: 5.0,
      onlineStatus: "offline",
      selectedVehicle: vehicle,
      fleet_reduction: 0.0,
      pakyaw_reduction: 0.0,
      balance: 0.0,
      blocked: false,
      createdAt: Timestamp.now(),
      location: location,
    });

    await setDoc(doc(subCol, userCredential.user.uid), {
      currentlyLinked: 0,
    });

    await addDoc(subCol2, docu);
    await signInWithEmailAndPassword(
      auth,
      dataAdmin.data().email,
      dataAdmin.data().password
    );
    isCreatingDriver = false;
    await addDoc(collection(db, "AdminLogs"), {
      user_id: userId,
      category: "Add Drivers",
      action: `User-${userId.substring(
        0,
        8
      )} Added Driver-${userCredential.user.uid.substring(0, 8)}`,
      actionTime: Timestamp.now(),
    });

    // Show success message
    alert("Driver created successfully!");
    form.reset();
  } catch (error) {
    console.error("Error creating driver:", error);
    alert(`Error creating driver: ${error.message}`);
  }
};

async function checkDuplicate(Firstname, Lastname, Phonenumber) {
  let value = false;
  const check = query(
    collection(db, "Driver"),
    where("first_name", "==", Firstname),
    where("last_name", "==", Lastname),
    where("phone_number", "==", Phonenumber),
    limit(1)
  );
  const check2 = query(
    collection(db, "Driver"),
    where("phone_number", "==", Phonenumber),
    limit(1)
  );
  const [result1, result2] = await Promise.all([
    getDocs(check),
    getDocs(check2),
  ]);
  if (!result1.empty) {
    value = true;
  }
  if (!result2.empty) {
    value = true;
  }

  return value;
}
