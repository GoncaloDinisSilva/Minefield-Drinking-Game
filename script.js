document.addEventListener("DOMContentLoaded", () => {
  const GRID_SIZE = 10;
  const TOTAL_BLOCKS = GRID_SIZE * GRID_SIZE;
  const maxPlayers = 6;    // reduced from 8
  const minPlayers = 2;
  const diceIcons = ["fa-dice-one", "fa-dice-two", "fa-dice-three"];

  const playerForm = document.getElementById("player-form");
  const playerInput = document.getElementById("player-name-input");
  const addPlayerBtn = document.getElementById("add-player-btn");
  const playerListMenu = document.getElementById("player-list-menu");
  const playerListSidebar = document.getElementById("player-list");
  const maxMessage = document.getElementById("max-message");
  const startBtn = document.getElementById("start-game-btn");
  const menuDiv = document.getElementById("menu");
  const gameDiv = document.getElementById("game");
  const currentPlayerEl = document.getElementById("current-player");
  const rollDiceBtn = document.getElementById("roll-dice-btn");
  const diceResultEl = document.getElementById("dice-result");
  const movesRemainingEl = document.getElementById("moves-remaining");
  const gridEl = document.getElementById("grid");
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");
  const popupCloseBtn = document.getElementById("popup-close");
  const popupEndButtons = document.getElementById("popup-endgame-buttons");
  const restartBtn = document.getElementById("restart-btn");
  const exitBtn = document.getElementById("exit-btn");
  const blocksRemainingValueEl = document.getElementById("blocks-remaining-value");

  let players = [];
  let currentPlayerIndex = 0;
  let picksRemaining = 0;
  let mineIndex = null;
  let gameActive = false;
  let gameEnded = false;

  // Fisher–Yates shuffle to randomize player order
  function shufflePlayers() {
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }
  }

  // 1) Enable/disable "Add Player" based on input content
  function toggleAddButton() {
    addPlayerBtn.disabled = playerInput.value.trim() === "";
  }
  playerInput.addEventListener("input", toggleAddButton);
  toggleAddButton();

  // 2) Add player submit
  playerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = playerInput.value.trim();
    if (!name) return;
    if (players.includes(name)) {
      return showPopup("That name has already been added.");
    }
    players.push(name);
    playerInput.value = "";
    updatePlayerLists();
    toggleAddButton();
  });

  // 3) Update lists and button states
  function updatePlayerLists() {
    playerListMenu.innerHTML = "";
    playerListSidebar.innerHTML = "";
    players.forEach((p, i) => {
      const li1 = document.createElement("li");
      li1.textContent = p;
      const rem1 = document.createElement("span");
      rem1.textContent = "×";
      rem1.classList.add("remove-button");
      rem1.addEventListener("click", () => removePlayer(i));
      li1.appendChild(rem1);
      playerListMenu.appendChild(li1);

      const li2 = document.createElement("li");
      li2.textContent = p;
      if (i === currentPlayerIndex) li2.classList.add("current");
      playerListSidebar.appendChild(li2);
    });

    addPlayerBtn.disabled =
      playerInput.value.trim() === "" || players.length >= maxPlayers;
    playerInput.disabled = players.length >= maxPlayers;
    maxMessage.classList.toggle("hidden", players.length < maxPlayers);
    startBtn.disabled = players.length < minPlayers;
  }

  // 4) Remove player
  function removePlayer(index) {
    players.splice(index, 1);
    if (currentPlayerIndex >= players.length) currentPlayerIndex = 0;
    updatePlayerLists();
    toggleAddButton();
  }

  // 5) Popup handlers
  function showPopup(msg, isGameOver = false) {
    popupMessage.textContent = msg;
    popupEndButtons.classList.toggle("hidden", !isGameOver);
    popupCloseBtn.classList.toggle("hidden", isGameOver);
    popup.classList.remove("hidden");
  }
  popupCloseBtn.addEventListener("click", () => popup.classList.add("hidden"));
  restartBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
    initializeGrid();
    placeMine();
    // Completely randomize turn order on restart
    shufflePlayers();
    currentPlayerIndex = 0;
    updatePlayerLists();
    updateTurn();
    updateBlocksCounter(); // Update counter on restart
    gameActive = true;
    gameEnded = false;
  });
  exitBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
    gameDiv.classList.add("hidden");
    menuDiv.classList.remove("hidden");
    players.length = 0;
    currentPlayerIndex = 0;
    updatePlayerLists();
    toggleAddButton();
  });

  // 6) Grid init
  function initializeGrid() {
    gridEl.innerHTML = "";
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      const block = document.createElement("div");
      block.classList.add("block");
      if ((row + col) % 2 === 0) block.classList.add("alt");
      block.dataset.index = i;
      block.innerHTML = '<i class="fas fa-beer"></i>';
      block.addEventListener("click", onBlockClick);
      gridEl.appendChild(block);
    }
  }

  // 7) Place mine
  function placeMine() {
    mineIndex = Math.floor(Math.random() * TOTAL_BLOCKS);
    console.log("Mine at", mineIndex);
  }

  // 8) Disable/enable blocks
  function disableBlocks() {
    document.querySelectorAll(".block").forEach((block) => {
      if (!block.classList.contains("removed")) {
        block.classList.add("disabled");
      }
    });
  }
  function enableBlocks() {
    document.querySelectorAll(".block").forEach((block) => {
      if (!block.classList.contains("removed")) {
        block.classList.remove("disabled");
      }
    });
  }

  // 9) Update turn
  function updateTurn() {
    currentPlayerEl.textContent = players[currentPlayerIndex];
    diceResultEl.innerHTML = "";
    movesRemainingEl.textContent = "";
    picksRemaining = 0;
    rollDiceBtn.disabled = false;
    disableBlocks();
    Array.from(playerListSidebar.children).forEach((li, i) =>
      li.classList.toggle("current", i === currentPlayerIndex)
    );
  }

  // 10) Start game
  startBtn.addEventListener("click", () => {
    // Completely randomize turn order on new game
    shufflePlayers();
    currentPlayerIndex = 0;
    updatePlayerLists();

    menuDiv.classList.add("hidden");
    gameDiv.classList.remove("hidden");
    rollDiceBtn.classList.remove("hidden");
    initializeGrid();
    placeMine();
    updateBlocksCounter(); // Update counter on start
    gameActive = true;
    gameEnded = false;
    updateTurn();
  });

  // 11) Roll dice
  rollDiceBtn.addEventListener("click", () => {
    if (!gameActive || picksRemaining > 0) {
      if (picksRemaining > 0) showPopup("Finish selecting blocks first.");
      return;
    }
    disableBlocks();
    const roll = Math.floor(Math.random() * diceIcons.length);
    picksRemaining = roll + 1;
    diceResultEl.innerHTML = `<i class="fas ${diceIcons[roll]}"></i>`;
    movesRemainingEl.textContent = `× ${picksRemaining}`;
    rollDiceBtn.disabled = true;
    enableBlocks();
  });

  // 12) Block click
  function onBlockClick(e) {
    if (!gameActive || picksRemaining <= 0) return;
    const block = e.currentTarget;
    const idx = +block.dataset.index;
    if (block.classList.contains("removed")) return;

    if (idx === mineIndex) {
      block.classList.add("mine-hit");
      gameActive = false;
      gameEnded = true;
      return showPopup(
        `${players[currentPlayerIndex]} hit the mine! Game over.`,
        true
      );
    }
    block.classList.add("removed");
    updateBlocksCounter(); // Update counter on block click
    picksRemaining--;
    movesRemainingEl.textContent = `× ${picksRemaining}`;
    if (picksRemaining === 0) {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      updateTurn();
    }
  }

  // 13) Blocks counter
  function updateBlocksCounter() {
    const removedBlocks = document.querySelectorAll('.block.removed').length;
    const remainingBlocks = TOTAL_BLOCKS - removedBlocks;
    blocksRemainingValueEl.textContent = remainingBlocks;
  }

  // 14) Start with blocks disabled
  disableBlocks();
});