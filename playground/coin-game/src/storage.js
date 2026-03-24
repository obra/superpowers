const LEADERBOARD_KEY = "coin_game_leaderboard_v1";
const MAX_SCORES = 10;

export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => typeof entry?.score === "number");
  } catch (_error) {
    return [];
  }
}

export function saveScore(score) {
  const leaderboard = loadLeaderboard();
  const next = [
    ...leaderboard,
    {
      score,
      timestamp: Date.now(),
    },
  ];

  next.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timestamp - b.timestamp;
  });

  const top10 = next.slice(0, MAX_SCORES);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10));
  return top10;
}
