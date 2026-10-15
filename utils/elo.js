// ══════════════════════════════════════════
// ELO RATING
// ══════════════════════════════════════════

const K_FACTOR = 32;

function calculateElo(ratingA, ratingB, scoreA) {
    // scoreA: 1 = g'alaba, 0.5 = durang, 0 = mag'lubiyat
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 - expectedA;

    const scoreB = 1 - scoreA;

    const newRatingA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
    const newRatingB = Math.round(ratingB + K_FACTOR * (scoreB - expectedB));

    return {
        newRatingA: Math.max(100, newRatingA),   // Minimum 100
        newRatingB: Math.max(100, newRatingB)
    };
}

module.exports = { calculateElo };
