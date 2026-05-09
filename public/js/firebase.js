import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

const firebaseConfig = {
    apiKey:            'AIzaSyDpyJe9GfkBro93lMHdUN6l0YEfAsAvmAk',
    authDomain:        'yoinnapp.firebaseapp.com',
    projectId:         'yoinnapp',
    storageBucket:     'yoinnapp.firebasestorage.app',
    messagingSenderId: '445235194138',
    appId:             '1:445235194138:web:54f11d53ea0835b65ae4a3',
    measurementId:     'G-EWFJ8V55LD',
};

export const app       = initializeApp(firebaseConfig);
export const db        = getFirestore(app);
export const analytics = getAnalytics(app);
