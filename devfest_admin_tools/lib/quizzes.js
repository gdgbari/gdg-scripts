const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { deleteAllDocuments } = require('./helpers');

const firestore = getFirestore();

module.exports = {
    removeDeprecatedFields,
    deleteAllQuizzes,
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

async function deleteAllQuizzes() {
    const questionsRef = firestore.collection('questions');
    await deleteAllDocuments(questionsRef);
    const quizzesRef = firestore.collection('quizzes');
    await deleteAllDocuments(quizzesRef);
}