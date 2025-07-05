const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const newGameBtn = document.getElementById("newGame");
let gameId = null;
let board = [];

function renderBoard() {
  boardEl.innerHTML = "";
  board.forEach((cell, index) => {
    const btn = document.createElement("button");
    btn.style.width = "100px";
    btn.style.height = "100px";
    btn.textContent = cell;
    btn.addEventListener("click", () => makeMove(index));
    boardEl.appendChild(btn);
  });
}

async function newGame() {
  const res = await fetch("/tictactoe/new", { method: "POST" });
  const data = await res.json();
  gameId = data.id;
  board = data.board;
  statusEl.textContent = "";
  renderBoard();
}

async function makeMove(position) {
  if (!gameId) return;
  const res = await fetch("/tictactoe/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id: gameId, position }),
  });
  if (!res.ok) {
    alert("Invalid move");
    return;
  }
  const data = await res.json();
  board = data.board;
  renderBoard();
  if (data.winner) {
    statusEl.textContent =
      data.winner === "draw" ? "Draw!" : `${data.winner} wins!`;
    gameId = null;
  }
}

newGameBtn.addEventListener("click", newGame);
window.addEventListener("load", newGame);
