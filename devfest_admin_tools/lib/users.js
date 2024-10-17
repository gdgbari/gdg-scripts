const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getDatabase } = require('firebase-admin/database');
const { deleteAllFromCollectionRef } = require('./helpers');

const auth = getAuth();
const firestore = getFirestore();
const realtimeDb = getDatabase();

module.exports = {
    createUser,
    deleteUser,
    deleteUserSubcollections
};

async function createFirebaseAuthUser({ name, surname, email, password }) {
    const userRecord = await auth.createUser(
        {
            email: email,
            emailVerified: true,
            password: password,
            displayName: `${name} ${surname}`,
            disabled: false
        }
    );

    return userRecord.uid;
}

async function createFirestoreUser({ userId, nickname, name, surname, email, role }) {
    const userDoc = await firestore.collection('users').doc(userId).set({
        nickname: nickname,
        name: name,
        surname: surname,
        email: email,
        role: role,
        group: null
    });

    return userDoc;
}

async function createRealtimeDatabaseUser({ userId, nickname }) {
    const rtdbUserRef = realtimeDb.ref(`leaderboard/users/${userId}`);
    await rtdbUserRef.set({
        nickname: nickname,
        groupColor: 'black',
        score: 0,
        timestamp: Date.now()
    });
}

async function createUser({ nickname, name, surname, email, password, role }) {
    const userId = await createFirebaseAuthUser({ name, surname, email, password });
    await createFirestoreUser({ userId, nickname, name, surname, email, role });
    await createRealtimeDatabaseUser({ userId, nickname });

    return userId;
}

async function deleteFirebaseAuthUser(userId) {
    try {
        await auth.deleteUser(userId);
    } catch (error) {
        console.log('Firebase Auth: User not found');
    }
}

async function deleteFirestoreUser(userId) {
    const userDocRef = firestore.collection('users').doc(userId);
    const subCollections = await userDocRef.listCollections();
    for (const subCollection of subCollections) {
        await deleteAllFromCollectionRef(subCollection);
    }
    await userDocRef.delete();
}

async function deleteRealtimeDatabaseUser(userId) {
    const userDbRef = realtimeDb.ref(`leaderboard/users/${userId}`);
    await userDbRef.remove();
}

async function deleteUser(userId) {
    await deleteFirebaseAuthUser(userId);
    await deleteFirestoreUser(userId);
    await deleteRealtimeDatabaseUser(userId);
}

async function deleteUserSubcollections() {
    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.get();

    for (const doc of snapshot.docs) {
        const subCollections = await doc.ref.listCollections();
        if (subCollections.length > 0) {
            for (const subCollection of subCollections) {
                await deleteAllFromCollectionRef(subCollection);
            }
        }
    }
}