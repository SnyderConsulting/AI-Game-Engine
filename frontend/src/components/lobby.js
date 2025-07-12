/**
 * Setup lobby UI for creating or joining a game.
 *
 * @param {(id: string) => void} startGame - Callback invoked when the lobby
 *   acquires a valid game ID.
 * @returns {void}
 */
export function setupLobby(startGame) {
  const lobby = document.getElementById("lobby");
  const createBtn = document.getElementById("createGameBtn");
  const joinBtn = document.getElementById("joinGameBtn");
  const idInput = document.getElementById("gameIdInput");

  createBtn?.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/games", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      lobby.style.display = "none";
      startGame(data.gameId);
    } catch (err) {
      console.error("Failed to create game", err);
    }
  });

  joinBtn?.addEventListener("click", () => {
    const id = idInput?.value.trim();
    if (!id) return;
    lobby.style.display = "none";
    startGame(id);
  });
}
