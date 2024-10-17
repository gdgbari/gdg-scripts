const { getFirestore, } = require('firebase-admin/firestore');

const firestore = getFirestore();

module.exports = {
    deleteAllDocuments,
    deleteAllFromCollectionRef
}

async function deleteAllFromCollectionRef(collectionRef) {
    const documents = await collectionRef.listDocuments();
    for (const doc of documents) {
        const subCollections = await doc.listCollections();
        if (subCollections.length > 0) {
            for (const subCollection of subCollections) {
                await deleteAllFromCollectionRef(subCollection);
            }
        }
        await doc.delete();
    }
}

async function deleteAllDocuments(collectionRef) {
    const snapshot = await collectionRef.get();

    const batch = firestore.batch();
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}