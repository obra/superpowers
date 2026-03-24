import { loadLeaderboard, saveScore } from "./storage.js";

const GAME_DURATION_SECONDS = 60;
const PLAYER_SPEED = 340; // px/s
const COIN_SPAWN_INTERVAL_MS = 480;
const COIN_FALL_SPEED = 200; // px/s

const state = {
  status: "idle", // idle | playing | ended | aborted
  score: 0,
  timeLeft: GAME_DURATION_SECONDS,
  playerX: 0,
  playerWidth: 70,
  pressedKeys: new Set(),
  coins: [],
  lastFrameTime: 0,
  coinSpawnAccumulatorMs: 0,
  timerId: null,
  rafId: null,
};

const ui = {
  homeScreen: document.getElementById("home-screen"),
  gameScreen: document.getElementById("game-screen"),
  resultScreen: document.getElementById("result-screen"),
  startButton: document.getElementById("start-button"),
  abortButton: document.getElementById("abort-button"),
  restartButton: document.getElementById("restart-button"),
  gameArea: document.getElementById("game-area"),
  player: document.getElementById("player"),
  score: document.getElementById("score"),
  time: document.getElementById("time"),
  resultTitle: document.getElementById("result-title"),
  finalScore: document.getElementById("final-score"),
  leaderboardList: document.getElementById("leaderboard-list"),
};

function setScreen(screen) {
  const showHome = screen === "home";
  const showGame = screen === "game";
  const showResult = screen === "result";
  ui.homeScreen.classList.toggle("hidden", !showHome);
  ui.gameScreen.classList.toggle("hidden", !showGame);
  ui.resultScreen.classList.toggle("hidden", !showResult);
}

function renderHud() {
  ui.score.textContent = String(state.score);
  ui.time.textContent = String(state.timeLeft);
}

function renderPlayer() {
  ui.player.style.left = `${state.playerX}px`;
}

function clearCoins() {
  for (const coin of state.coins) {
    coin.el.remove();
  }
  state.coins = [];
}

function resetRoundState() {
  state.score = 0;
  state.timeLeft = GAME_DURATION_SECONDS;
  state.coinSpawnAccumulatorMs = 0;
  state.lastFrameTime = 0;
  state.pressedKeys.clear();
  clearCoins();
  const areaWidth = ui.gameArea.clientWidth;
  state.playerX = (areaWidth - state.playerWidth) / 2;
  renderPlayer();
  renderHud();
}

function stopEngines() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}

function spawnCoin() {
  const areaWidth = ui.gameArea.clientWidth;
  const maxX = Math.max(0, areaWidth - 22);
  const coin = document.createElement("div");
  coin.className = "coin";
  const x = Math.random() * maxX;
  coin.style.left = `${x}px`;
  coin.style.top = "-24px";
  ui.gameArea.appendChild(coin);
  state.coins.push({ x, y: -24, width: 22, height: 22, el: coin });
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updateCoins(deltaSeconds) {
  const playerRect = {
    x: state.playerX,
    y: ui.gameArea.clientHeight - 12 - 38,
    width: state.playerWidth,
    height: 38,
  };

  for (let i = state.coins.length - 1; i >= 0; i -= 1) {
    const coin = state.coins[i];
    coin.y += COIN_FALL_SPEED * deltaSeconds;
    coin.el.style.top = `${coin.y}px`;

    if (coin.y > ui.gameArea.clientHeight + 24) {
      coin.el.remove();
      state.coins.splice(i, 1);
      continue;
    }

    const coinRect = { x: coin.x, y: coin.y, width: coin.width, height: coin.height };
    if (intersects(playerRect, coinRect)) {
      state.score += 1;
      renderHud();
      coin.el.remove();
      state.coins.splice(i, 1);
    }
  }
}

function updatePlayer(deltaSeconds) {
  const moveLeft = state.pressedKeys.has("ArrowLeft") || state.pressedKeys.has("KeyA");
  const moveRight = state.pressedKeys.has("ArrowRight") || state.pressedKeys.has("KeyD");
  const direction = Number(moveRight) - Number(moveLeft);
  const areaWidth = ui.gameArea.clientWidth;
  const maxX = Math.max(0, areaWidth - state.playerWidth);
  state.playerX += direction * PLAYER_SPEED * deltaSeconds;
  state.playerX = Math.max(0, Math.min(maxX, state.playerX));
  renderPlayer();
}

function loop(timestamp) {
  if (state.status !== "playing") return;
  if (!state.lastFrameTime) state.lastFrameTime = timestamp;
  const deltaMs = timestamp - state.lastFrameTime;
  const deltaSeconds = deltaMs / 1000;
  state.lastFrameTime = timestamp;

  updatePlayer(deltaSeconds);
  updateCoins(deltaSeconds);

  state.coinSpawnAccumulatorMs += deltaMs;
  while (state.coinSpawnAccumulatorMs >= COIN_SPAWN_INTERVAL_MS) {
    spawnCoin();
    state.coinSpawnAccumulatorMs -= COIN_SPAWN_INTERVAL_MS;
  }

  state.rafId = requestAnimationFrame(loop);
}

function renderLeaderboard(board = loadLeaderboard()) {
  ui.leaderboardList.innerHTML = "";
  if (board.length === 0) {
    const li = document.createElement("li");
    li.textContent = "目前尚無紀錄";
    ui.leaderboardList.appendChild(li);
    return;
  }

  board.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `#${index + 1} - ${entry.score} 分`;
    ui.leaderboardList.appendChild(li);
  });
}

function finishGame(isAborted) {
  stopEngines();
  state.status = isAborted ? "aborted" : "ended";
  ui.finalScore.textContent = String(state.score);

  if (isAborted) {
    ui.resultTitle.textContent = "本局已中止（不列入排行榜）";
    setScreen("home");
  } else {
    ui.resultTitle.textContent = "本局結束";
    const board = saveScore(state.score);
    renderLeaderboard(board);
    setScreen("result");
  }
}

function tickTimer() {
  if (state.status !== "playing") return;
  state.timeLeft -= 1;
  renderHud();

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    renderHud();
    finishGame(false);
  }
}

function startGame() {
  state.status = "playing";
  resetRoundState();
  setScreen("game");
  state.timerId = setInterval(tickTimer, 1000);
  state.rafId = requestAnimationFrame(loop);
}

function abortGame() {
  if (state.status !== "playing") return;
  const confirmed = window.confirm("確定要中止本局嗎？");
  if (!confirmed) return;
  finishGame(true);
}

function handleKeyDown(event) {
  if (state.status !== "playing") return;
  state.pressedKeys.add(event.code);
}

function handleKeyUp(event) {
  state.pressedKeys.delete(event.code);
}

function bindEvents() {
  ui.startButton.addEventListener("click", startGame);
  ui.abortButton.addEventListener("click", abortGame);
  ui.restartButton.addEventListener("click", () => setScreen("home"));
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
}

function init() {
  bindEvents();
  renderLeaderboard();
  setScreen("home");
  resetRoundState();
}

init();
