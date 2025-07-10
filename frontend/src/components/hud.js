export function createHUD({ pickupMsg, waveCounterDiv }) {
  let pickupTimer = 0;

  function showPickupMessage(text) {
    pickupMsg.textContent = text;
    pickupTimer = 60;
  }

  function clearPickupMessage() {
    pickupMsg.textContent = "";
    pickupTimer = 0;
  }
  function update() {
    if (pickupTimer > 0) {
      pickupTimer--;
      if (pickupTimer === 0) pickupMsg.textContent = "";
    }
  }

  function setWave(wave) {
    waveCounterDiv.textContent = `Wave ${wave}`;
  }

  function showWaveCounter() {
    waveCounterDiv.style.display = "block";
  }

  function hideWaveCounter() {
    waveCounterDiv.style.display = "none";
  }

  function render(ctx, player, inventory, countItem) {
    ctx.fillStyle = "black";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Health: ${player.health}`, 10, 20);
    if (player.weapon && player.weapon.type === "bow") {
      ctx.fillText(`Arrows: ${countItem(inventory, "arrow")}`, 10, 40);
    }
  }

  return {
    showPickupMessage,
    update,
    clearPickupMessage,
    setWave,
    showWaveCounter,
    hideWaveCounter,
    render,
  };
}
