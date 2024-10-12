const { initializeApp, cert } = require('firebase-admin/app');

const serviceAccount = require('./serviceAccountKey.json');

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'devfest-bari-24-app.appspot.com',
    databaseURL: "https://devfest-bari-24-app-default-rtdb.europe-west1.firebasedatabase.app",
});

const usersLib = require('./lib/users');
const resetLib = require('./lib/reset');
const quizzesLib = require('./lib/quizzes');
