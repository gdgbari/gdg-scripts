const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const firestore = getFirestore();

module.exports = {
    removeDeprecatedFields
}

async function removeDeprecatedFields() {
    const quizzesRef = firestore.collection('quizzes');
    const snapshot = await quizzesRef.get();

    const batch = firestore.batch();
    snapshot.forEach(doc => {
        batch.update(doc.ref, {
            talkId: FieldValue.delete(),
            sponsorId: FieldValue.delete()
        });
    });

    await batch.commit();
}
