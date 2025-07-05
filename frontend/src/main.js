const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function update() {
  // Game update logic will go here
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'green';
  ctx.fillRect(50, 50, 100, 100);
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', () => {
  gameLoop();
});
