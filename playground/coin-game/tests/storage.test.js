import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();

globalThis.localStorage = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, String(value));
  },
  clear() {
    store.clear();
  },
};

const { loadLeaderboard, saveScore } = await import("../src/storage.js");

test("loadLeaderboard returns empty array when no data", () => {
  localStorage.clear();
  assert.deepEqual(loadLeaderboard(), []);
});

test("saveScore sorts by score descending", () => {
  localStorage.clear();
  saveScore(5);
  saveScore(10);
  saveScore(7);
  const board = loadLeaderboard();
  assert.deepEqual(
    board.map((entry) => entry.score),
    [10, 7, 5],
  );
});

test("saveScore keeps earlier timestamp first on ties", () => {
  localStorage.clear();
  const originalNow = Date.now;
  let current = 1000;
  Date.now = () => current;
  saveScore(8);
  current = 2000;
  saveScore(8);
  Date.now = originalNow;

  const board = loadLeaderboard();
  assert.equal(board[0].score, 8);
  assert.equal(board[1].score, 8);
  assert.equal(board[0].timestamp, 1000);
  assert.equal(board[1].timestamp, 2000);
});

test("saveScore keeps top 10 only", () => {
  localStorage.clear();
  for (let i = 1; i <= 12; i += 1) {
    saveScore(i);
  }
  const board = loadLeaderboard();
  assert.equal(board.length, 10);
  assert.equal(board[0].score, 12);
  assert.equal(board[9].score, 3);
});
