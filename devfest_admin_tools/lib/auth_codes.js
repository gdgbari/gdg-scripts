const { getFirestore, } = require('firebase-admin/firestore');
const QRCode = require('qrcode');

const firestore = getFirestore();

module.exports = { generateAuthorizationCodes };

async function generateAuthorizationCodes(numCodes) {
    const groupsCollection = firestore.collection('groups');
    const groupsSnapshot = await groupsCollection.get();
    const groups = groupsSnapshot.docs.map(doc => doc.ref);

    if (groups.length === 0) {
        throw new Error('No groups found');
    }

    const authorizationCodesCollection = firestore.collection('authorizationCodes');
    const batch = firestore.batch();

    for (let i = 0; i < numCodes; i++) {
        const groupRef = groups[i % groups.length];
        const newDocRef = authorizationCodesCollection.doc();
        batch.set(newDocRef, {
            expired: false,
            group: groupRef
        });

        const qrCodeString = `checkin:${newDocRef.id}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeString);
        console.log(`QR Code for ${newDocRef.id}: ${qrCodeDataURL}`);
    }

    //await batch.commit();
}

