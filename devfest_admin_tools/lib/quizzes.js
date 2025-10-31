const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { deleteAllDocuments } = require('./helpers');

const firestore = getFirestore();

module.exports = {
    removeDeprecatedFields,
    deleteAllQuizzes,
    openAllQuizzes,
    closeAllQuizzes,
    getSpecialQuizFromUser,
    fixWorkshops,
    updateTimerDuration
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

async function fixWorkshops() {
    const titles = [
        "Domingo Dirutigliano's talk"
    ];
    const talkQuizzes = await firestore.collection('quizzes').where('type', '==', 'talk').get();

    const batch = firestore.batch();
    const updatePromises = [];

    talkQuizzes.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(quiz => titles.includes(quiz.title))
        .forEach(quiz => {
            console.log(`Updating quiz: ${quiz.title}`);
            const quizRef = firestore.collection('quizzes').doc(quiz.id);
            const newMaxScore = 120;
            batch.update(quizRef, { maxScore: newMaxScore });

            const questionList = quiz.questionList || [];
            const scorePerQuestion = newMaxScore / questionList.length;

            questionList.forEach(questionRef => {
                console.log(`Updating question: ${questionRef.path}`);
                updatePromises.push(
                    firestore.doc(questionRef.path).update({ value: scorePerQuestion })
                );
            });
        });

    await batch.commit();
    await Promise.all(updatePromises);
    console.log('All updates completed.');
}

async function updateTimerDuration() {
    const quizzesRef = firestore.collection('quizzes');
    const snapshot = await quizzesRef.get();

    const batch = firestore.batch();
    snapshot.forEach(doc => {
        const quizData = doc.data();
        const questionListLength = quizData.questionList ? quizData.questionList.length : 0;
        const newTimerDuration = 60 * 1000 * questionListLength;
        batch.update(doc.ref, {
            timerDuration: newTimerDuration
        });
    });

    await batch.commit();
}