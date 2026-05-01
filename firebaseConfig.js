import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase'den aldığın güncel bilgiler
const firebaseConfig = {
    apiKey: "AIzaSyDH4jGLfI1wNkzMI3Yoic7UhisO8HV3cxg",
    authDomain: "buddy-8ad86.firebaseapp.com",
    projectId: "buddy-8ad86",
    storageBucket: "buddy-8ad86.firebasestorage.app",
    messagingSenderId: "824710800701",
    appId: "1:824710800701:web:a602dabe06236e81661154"
};

// Uygulamayı başlatıyoruz
const app = initializeApp(firebaseConfig);

// DİKKAT: Diğer dosyalarımızın (Login.tsx vb.) tanıması için bu isimlerle export ediyoruz
export const authInstance = getAuth(app);
export const db = getFirestore(app);

export default { authInstance, db };