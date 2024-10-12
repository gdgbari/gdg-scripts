module.exports = {
    resetLeaderboard
};

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
    const usersRef = rtdb.ref('leaderboard/users');
    resetLeaderboardByRef(usersRef);
    const groupsRef = rtdb.ref('leaderboard/groups');
    resetLeaderboardByRef(groupsRef);
}