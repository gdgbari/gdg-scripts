const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getDatabase } = require('firebase-admin/database');

const auth = getAuth();
const firestore = getFirestore();
const realtimeDb = getDatabase();

module.exports = {
    resetUsers,
    resetLeaderboard,
}

async function getStaffUserIds() {
    const snapshot = await firestore.collection('users').where('role', '==', 'staff').get();
    const staffUserIds = snapshot.docs.map(doc => doc.id);
    return staffUserIds;
}

async function resetFirebaseAuthUser() {
    const staffUserIds = await getStaffUserIds();
    const listUsersResult = await auth.listUsers();

    for (const userRecord of listUsersResult.users) {
        if (!staffUserIds.includes(userRecord.uid)) {
            await auth.deleteUser(userRecord.uid);
        }
    }
}

async function resetFirestoreUsers() {
    const snapshot = await firestore.collection('users').get();

    for (const doc of snapshot.docs) {
        if (doc.data().role !== 'staff') {
            const subcollections = await doc.ref.listCollections();
            for (const subcollection of subcollections) {
                const subcollectionSnapshot = await subcollection.get();
                const batch = firestore.batch();
                subcollectionSnapshot.docs.forEach(subDoc => {
                    batch.delete(subDoc.ref);
                });
                await batch.commit();
            }
            await doc.ref.delete();
        }
    }
}

async function resetRealtimeDatabaseUsers() {
    const staffUserIds = await getStaffUserIds();
    const usersRef = realtimeDb.ref('leaderboard/users');
    const snapshot = await usersRef.once('value');

    if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach(childSnapshot => {
            if (!staffUserIds.includes(childSnapshot.key)) {
                updates[childSnapshot.key] = null;
            }
        });
        await usersRef.update(updates);
    }
}

async function resetUsers() {
    await resetFirebaseAuthUser();
    await resetFirestoreUsers();
    await resetRealtimeDatabaseUsers();
}

async function resetLeaderboardByRef(ref) {
    const snapshot = await ref.once('value');
    const keys = snapshot.exists() ? Object.keys(snapshot.val()) : [];

    const timestamp = Date.now();

    keys.forEach((key) => ref.child(key).update({
        score: 0,
        timestamp: timestamp,
    }));
}

async function resetLeaderboard() {
    const usersRef = realtimeDb.ref('leaderboard/users');
    resetLeaderboardByRef(usersRef);
    const groupsRef = realtimeDb.ref('leaderboard/groups');
    resetLeaderboardByRef(groupsRef);
}
