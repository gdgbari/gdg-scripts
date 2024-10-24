const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getDatabase } = require('firebase-admin/database');

const fs = require('fs');
const path = require('path');

const auth = getAuth();
const firestore = getFirestore();
const realtimeDb = getDatabase();

module.exports = { backupUsers, backupFirestore, backupRealtimeDb };

async function backupUsers() {
    const users = [];
    let nextPageToken;

    do {
        const listUsersResult = await auth.listUsers(1000, nextPageToken);
        listUsersResult.users.forEach((userRecord) => {
            users.push(userRecord.toJSON());
        });
        nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log('Backup completed. Number of users:', users.length);
    const filePath = path.join(__dirname, 'users_backup.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    console.log('Users saved to', filePath);
}

async function backupFirestore() {
    const collections = await firestore.listCollections();
    const backupData = {};

    for (const collection of collections) {
        const snapshot = await collection.get();
        backupData[collection.id] = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    }

    const backupFilePath = path.join(__dirname, 'firestore_backup.json');
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    console.log(`Firestore backup saved to ${backupFilePath}`);
}

async function backupRealtimeDb() {
    const ref = realtimeDb.ref();
    const snapshot = await ref.once('value');
    const backupData = snapshot.val();

    const backupFilePath = path.join(__dirname, 'realtime_db_backup.json');
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    console.log(`Realtime Database backup saved to ${backupFilePath}`);
}