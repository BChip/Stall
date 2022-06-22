import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBmdqG_NMXCslAVyvWT4rcXs9dqoohrrNM",
  authDomain: "stall-fefb9.firebaseapp.com",
  projectId: "stall-fefb9",
  storageBucket: "stall-fefb9.appspot.com",
  messagingSenderId: "183388867518",
  appId: "1:183388867518:web:0abbca1a14e562f67187ef",
  measurementId: "G-T5SBCMNFZH"
};

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)