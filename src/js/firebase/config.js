import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB8azP0QtyqeW0z1pFlvYnSaIH_LQ9-JR0",
    authDomain: "benjhaminarmas.firebaseapp.com",
    projectId: "benjhaminarmas",
    storageBucket: "benjhaminarmas.firebasestorage.app",
    messagingSenderId: "294104254352",
    appId: "1:294104254352:web:a73f7343a99e4820855515",
    measurementId: "G-20WDZLP526"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { app, db };