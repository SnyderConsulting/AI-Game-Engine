/**
 * Create the HUD overlay shown during gameplay.
 *
 * @param {{pickupMsg:HTMLElement, waveCounterDiv:HTMLElement}} param0
 *   Elements used to display pickup text and the current wave.
 * @returns {{
 *   showPickupMessage: Function,
 *   update: Function,
 *   clearPickupMessage: Function,
 *   setWave: Function,
 *   showWaveCounter: Function,
 *   hideWaveCounter: Function,
 *   render: Function,
 * }} HUD control methods.
 */
export function createHUD({ pickupMsg, waveCounterDiv }) {
  let pickupTimer = 0;
  pickupMsg.style.display = "none";

  function showPickupMessage(text) {
    pickupMsg.textContent = text;
    pickupMsg.style.display = "block";
    pickupTimer = 60;
  }

  function clearPickupMessage() {
    pickupMsg.textContent = "";
    pickupMsg.style.display = "none";
    pickupTimer = 0;
  }
  function update() {
    if (pickupTimer > 0) {
      pickupTimer--;
      if (pickupTimer === 0) {
        pickupMsg.textContent = "";
        pickupMsg.style.display = "none";
      }
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
