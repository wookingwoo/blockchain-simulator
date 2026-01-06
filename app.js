const state = {
  difficulty: 2,
  blockHeight: 1,
  prevHash: "GENESIS",
  transactions: "",
  miners: [],
  chain: [],
  logs: [],
  lastWinner: "-",
  autoMining: false,
  competition: false,
  totalAttempts: 0,
  totalRewards: 0,
  rewardValue: 6.25,
  tickInterval: 200,
  lastSummaryLog: 0,
};

const elements = {
  difficultyRange: document.getElementById("difficulty-range"),
  difficultyValue: document.getElementById("difficulty-value"),
  difficultyReadout: document.getElementById("difficulty-readout"),
  blocksReadout: document.getElementById("blocks-readout"),
  rewardsReadout: document.getElementById("rewards-readout"),
  targetText: document.getElementById("target-text"),
  expectedTries: document.getElementById("expected-tries"),
  prevHash: document.getElementById("prev-hash"),
  txList: document.getElementById("tx-list"),
  nonceInput: document.getElementById("nonce-input"),
  nonceStep: document.getElementById("nonce-step"),
  nonceRandom: document.getElementById("nonce-random"),
  autoMine: document.getElementById("auto-mine"),
  hashOutput: document.getElementById("hash-output"),
  hashStatus: document.getElementById("hash-status"),
  minerList: document.getElementById("miner-list"),
  chainList: document.getElementById("chain-list"),
  lastWinner: document.getElementById("last-winner"),
  blockHeight: document.getElementById("block-height"),
  totalTries: document.getElementById("total-tries"),
  logList: document.getElementById("log-list"),
  clearLog: document.getElementById("clear-log"),
  competitionToggle: document.getElementById("competition-toggle"),
  resetSim: document.getElementById("reset-sim"),
  tutorial: document.getElementById("tutorial"),
  startTutorial: document.getElementById("start-tutorial"),
  closeTutorial: document.getElementById("close-tutorial"),
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function randomHex(length) {
  return Math.floor(Math.random() * Math.pow(16, length))
    .toString(16)
    .padStart(length, "0")
    .toUpperCase();
}

function buildTransactions() {
  return `TX-${state.blockHeight}-${randomHex(4)}`;
}

function headerString(nonce) {
  return `${state.prevHash}|${state.transactions}|${nonce}`;
}

function toyHash(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  let h3 = 0x9e3779b9 ^ input.length;
  let h4 = 0x7f4a7c15 ^ input.length;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507);
  h4 = Math.imul(h4 ^ (h4 >>> 13), 3266489909);

  return [h1, h2, h3, h4]
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function computeHash(nonce) {
  return toyHash(headerString(nonce));
}

function targetPrefix() {
  return "0".repeat(state.difficulty);
}

function isSolved(hash) {
  return hash.startsWith(targetPrefix());
}

function truncateHash(hash) {
  if (!hash) {
    return "----";
  }
  const head = 6;
  const tail = 4;
  if (hash.length <= head + tail + 3) {
    return hash;
  }
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

function getYourMiner() {
  return state.miners.find((miner) => miner.id === "you");
}

function initMiners() {
  const miners = [
    { id: "you", name: "You", color: "var(--accent)", hashRate: 2 },
  ];

  if (state.competition) {
    miners.push(
      { id: "atlas", name: "Atlas Pool", color: "#ffb703", hashRate: 3 },
      { id: "nova", name: "Nova Rig", color: "#2ec4b6", hashRate: 4 },
      { id: "lumen", name: "Lumen Solo", color: "#ff6b6b", hashRate: 2 }
    );
  }

  state.miners = miners.map((miner) => ({
    ...miner,
    nonce: 0,
    attempts: 0,
    rewards: 0,
    lastHash: "",
    lastTickAttempts: 0,
    winner: false,
  }));
}

function setNonce(value) {
  const miner = getYourMiner();
  if (!miner) {
    return;
  }
  const safeValue = Math.max(0, Math.floor(Number(value) || 0));
  miner.nonce = safeValue;
  elements.nonceInput.value = safeValue;
  const hash = computeHash(safeValue);
  miner.lastHash = hash;
  updateHashView(hash);
}

function updateHashView(hash) {
  const solved = isSolved(hash);
  elements.hashOutput.textContent = hash;
  elements.hashOutput.classList.toggle("success", solved);
  elements.hashOutput.classList.toggle("fail", !solved);
  elements.hashStatus.textContent = solved ? "Solved!" : "No match";
  elements.hashStatus.classList.toggle("success", solved);
  elements.hashStatus.classList.toggle("fail", !solved);
}

function updateDifficultyUI() {
  elements.difficultyValue.textContent = state.difficulty;
  elements.difficultyReadout.textContent = state.difficulty;
  elements.targetText.textContent = targetPrefix();
  elements.expectedTries.textContent = formatNumber(
    Math.pow(16, state.difficulty)
  );
}

function updateHeaderUI() {
  elements.prevHash.textContent = truncateHash(state.prevHash);
  elements.prevHash.title = state.prevHash;
  elements.txList.textContent = state.transactions;
  elements.blockHeight.textContent = state.blockHeight;
}

function renderMiners() {
  const hashPerSecond = Math.round(1000 / state.tickInterval);
  elements.minerList.innerHTML = state.miners
    .map((miner) => {
      const status = miner.winner ? "winner" : "";
      const hashPreview = truncateHash(miner.lastHash);
      const hashTitle = miner.lastHash ? ` title="${miner.lastHash}"` : "";
      return `
        <article class="miner-card ${status}">
          <div class="miner-title">
            <span class="miner-dot" style="background:${miner.color}"></span>
            <span>${miner.name}</span>
          </div>
          <div class="miner-meta">
            <span>Hashrate</span>
            <span>${miner.hashRate * hashPerSecond} H/s</span>
          </div>
          <div class="miner-meta">
            <span>Attempts</span>
            <span>${formatNumber(miner.attempts)}</span>
          </div>
          <div class="miner-meta">
            <span>Rewards</span>
            <span>${miner.rewards.toFixed(2)}</span>
          </div>
          <div class="miner-hash mono"${hashTitle}>${hashPreview}</div>
        </article>
      `;
    })
    .join("");
}

function renderChain() {
  if (state.chain.length === 0) {
    elements.chainList.innerHTML = `
      <div class="block-card empty">
        No blocks yet. Find a valid hash to create the first block.
      </div>
    `;
    return;
  }

  elements.chainList.innerHTML = state.chain
    .slice(-10)
    .map(
      (block) => `
        <div class="block-card">
          <strong>Block ${block.height}</strong>
          <span class="mono" title="${block.hash}">${truncateHash(block.hash)}</span>
          <span title="${block.prevHash}">Prev: ${truncateHash(block.prevHash)}</span>
          <span>Miner: ${block.miner}</span>
        </div>
      `
    )
    .join("");
}

function renderStats() {
  elements.blocksReadout.textContent = state.chain.length;
  elements.rewardsReadout.textContent = state.totalRewards.toFixed(2);
  elements.lastWinner.textContent = state.lastWinner;
  elements.totalTries.textContent = formatNumber(state.totalAttempts);
}

function addLog(type, message) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  const item = { type, message, time };
  state.logs.unshift(item);
  if (state.logs.length > 40) {
    state.logs.pop();
  }
  renderLogs();
}

function renderLogs() {
  elements.logList.innerHTML = state.logs
    .map(
      (item) => `
        <div class="log-item ${item.type}">
          <strong>${item.message}</strong>
          <span>${item.time}</span>
        </div>
      `
    )
    .join("");
}

function resetWinnerFlags() {
  state.miners.forEach((miner) => {
    miner.winner = false;
  });
}

function handleSuccess(miner, hash) {
  resetWinnerFlags();
  miner.winner = true;
  miner.rewards += state.rewardValue;
  state.totalRewards += state.rewardValue;
  state.lastWinner = miner.name;
  state.chain.push({
    height: state.chain.length + 1,
    hash,
    prevHash: state.prevHash,
    miner: miner.name,
  });
  addLog(
    "success",
    `${miner.name} mined block ${state.chain.length} and earned ${state.rewardValue}`
  );
  state.prevHash = hash;
  state.blockHeight += 1;
  state.transactions = buildTransactions();
  state.miners.forEach((entry) => {
    entry.nonce = 0;
    entry.lastHash = "";
    entry.lastTickAttempts = 0;
  });
  elements.nonceInput.value = 0;
  updateHeaderUI();
  setNonce(0);
  renderChain();
  renderMiners();
  renderStats();
}

function manualAttempt(nextNonce) {
  const miner = getYourMiner();
  if (!miner) {
    return;
  }
  miner.nonce = nextNonce;
  miner.attempts += 1;
  state.totalAttempts += 1;
  const hash = computeHash(miner.nonce);
  miner.lastHash = hash;
  updateHashView(hash);
  if (isSolved(hash)) {
    handleSuccess(miner, hash);
  } else {
    addLog("warn", `Nonce ${miner.nonce} failed to meet the target`);
  }
  renderMiners();
  renderStats();
}

function autoMineStep() {
  if (!state.autoMining) {
    return;
  }
  let solved = false;
  state.miners.forEach((miner) => {
    miner.lastTickAttempts = 0;
  });

  for (const miner of state.miners) {
    if (solved) {
      break;
    }
    for (let i = 0; i < miner.hashRate; i += 1) {
      miner.nonce += 1;
      miner.attempts += 1;
      miner.lastTickAttempts += 1;
      state.totalAttempts += 1;
      const hash = computeHash(miner.nonce);
      miner.lastHash = hash;
      if (isSolved(hash)) {
        solved = true;
        handleSuccess(miner, hash);
        break;
      }
    }
  }

  const yourMiner = getYourMiner();
  if (yourMiner) {
    updateHashView(yourMiner.lastHash || computeHash(yourMiner.nonce));
    elements.nonceInput.value = yourMiner.nonce;
  }
  renderMiners();
  renderStats();

  const now = Date.now();
  if (now - state.lastSummaryLog > 1200) {
    const attempts = state.miners.reduce(
      (sum, miner) => sum + miner.lastTickAttempts,
      0
    );
    if (attempts > 0) {
      addLog(
        "info",
        `Auto mining: ${attempts} nonce tries across ${state.miners.length} miners`
      );
    }
    state.lastSummaryLog = now;
  }
}

function setAutoMining(active) {
  state.autoMining = active;
  elements.autoMine.textContent = active ? "Stop Auto Mine" : "Auto Mine";
  elements.nonceInput.disabled = active;
  elements.nonceStep.disabled = active;
  elements.nonceRandom.disabled = active;
}

function resetSimulation({ keepDifficulty = true } = {}) {
  const difficulty = keepDifficulty ? state.difficulty : 2;
  state.difficulty = difficulty;
  state.blockHeight = 1;
  state.prevHash = "GENESIS";
  state.transactions = buildTransactions();
  state.chain = [];
  state.lastWinner = "-";
  state.totalAttempts = 0;
  state.totalRewards = 0;
  state.logs = [];
  initMiners();
  updateDifficultyUI();
  updateHeaderUI();
  setNonce(0);
  renderChain();
  renderMiners();
  renderStats();
  renderLogs();
}

function bindEvents() {
  elements.difficultyRange.addEventListener("input", (event) => {
    state.difficulty = Number(event.target.value);
    updateDifficultyUI();
    const miner = getYourMiner();
    if (miner) {
      updateHashView(computeHash(miner.nonce));
    }
  });

  elements.nonceInput.addEventListener("input", (event) => {
    const next = Number(event.target.value);
    setNonce(next);
  });

  elements.nonceStep.addEventListener("click", () => {
    const miner = getYourMiner();
    if (!miner) {
      return;
    }
    manualAttempt(miner.nonce + 1);
  });

  elements.nonceRandom.addEventListener("click", () => {
    const randomValue = Math.floor(Math.random() * 100000);
    manualAttempt(randomValue);
  });

  elements.autoMine.addEventListener("click", () => {
    setAutoMining(!state.autoMining);
    addLog("info", state.autoMining ? "Auto mining started" : "Auto mining paused");
  });

  elements.clearLog.addEventListener("click", () => {
    state.logs = [];
    renderLogs();
  });

  elements.competitionToggle.addEventListener("change", (event) => {
    state.competition = event.target.checked;
    resetSimulation({ keepDifficulty: true });
    addLog(
      "info",
      state.competition ? "Competition mode enabled" : "Competition mode disabled"
    );
  });

  elements.resetSim.addEventListener("click", () => {
    resetSimulation({ keepDifficulty: true });
    addLog("info", "Simulation reset");
  });

  elements.startTutorial.addEventListener("click", () => {
    elements.tutorial.classList.remove("hidden");
  });

  elements.closeTutorial.addEventListener("click", () => {
    elements.tutorial.classList.add("hidden");
  });
}

function init() {
  state.transactions = buildTransactions();
  initMiners();
  updateDifficultyUI();
  updateHeaderUI();
  setNonce(0);
  renderChain();
  renderMiners();
  renderStats();
  renderLogs();
  bindEvents();
  setAutoMining(false);
  addLog("info", "Welcome! Adjust the nonce or start auto mining to begin.");
  setInterval(autoMineStep, state.tickInterval);
}

document.addEventListener("DOMContentLoaded", init);
