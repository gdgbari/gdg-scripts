const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { deleteAllDocuments } = require('./helpers');

const firestore = getFirestore();

module.exports = {
    removeDeprecatedFields,
    deleteAllQuizzes,
    openAllQuizzes,
    closeAllQuizzes,
    getSpecialQuizFromUser
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

async function openAllQuizzes() {
    const quizzesRef = firestore.collection('quizzes');
    const snapshot = await quizzesRef.get();

    const batch = firestore.batch();
    snapshot.forEach(doc => {
        batch.update(doc.ref, {
            isOpen: true
        });
    });

    await batch.commit();
}

async function closeAllQuizzes() {
    const quizzesRef = firestore.collection('quizzes');
    const snapshot = await quizzesRef.get();

    const batch = firestore.batch();
    snapshot.forEach(doc => {
        batch.update(doc.ref, {
            isOpen: false
        });
    });

    await batch.commit();
}

async function getSpecialQuizFromUser(userId) {
    const userQuizResults = await firestore.collection('users').doc(userId).collection('quizResults').get();
    const specialQuizzes = await firestore.collection('quizzes').where('type', '==', 'special').get();

    const specialQuizResults = [];
    userQuizResults.forEach(
        quizResult => {
            specialQuizzes.forEach(specialQuiz => {
                if (quizResult.data().quizId === specialQuiz.id) {
                    specialQuizResults.push(quizResult);
                }
            }
            );
        }
    );

    return specialQuizResults;
}