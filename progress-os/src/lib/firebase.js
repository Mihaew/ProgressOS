
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQddCZRG8yqnrvTjy6xAP1ZrtRwE6T8jI",
  authDomain: "progressos-42a5e.firebaseapp.com",
  projectId: "progressos-42a5e",
  storageBucket: "progressos-42a5e.firebasestorage.app",
  messagingSenderId: "222566049292",
  appId: "1:222566049292:web:f9668d3b05e4187237f029"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);