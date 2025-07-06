export function makeDraggable(div, bar, closeBtn, posStore, toggleFn) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  bar.addEventListener("mousedown", (e) => {
    dragging = true;
    offsetX = e.clientX - div.offsetLeft;
    offsetY = e.clientY - div.offsetTop;
    div.style.transform = "none";
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    posStore.left = e.clientX - offsetX;
    posStore.top = e.clientY - offsetY;
    div.style.left = posStore.left + "px";
    div.style.top = posStore.top + "px";
  });
  document.addEventListener("mouseup", () => {
    dragging = false;
  });
  closeBtn.addEventListener("click", () => toggleFn(false));
}
