import {
  moveItem,
  moveToHotbar,
  moveFromHotbar,
  swapHotbar,
  swapInventoryHotbar,
} from "../inventory.js";
export function createInventoryUI({
  inventoryDiv,
  inventoryGrid,
  hotbarDiv,
  inventoryBar,
  inventoryClose,
  inventoryPos,
}) {
  let open = false;
  let selectedSlot = null;

  function renderInventory(
    inventory,
    player,
    fireballCooldown,
    itemIcons,
    getItemCooldown,
  ) {
    inventoryGrid.innerHTML = "";
    inventory.slots.forEach((slot, i) => {
      const div = document.createElement("div");
      div.dataset.index = i;
      Object.assign(div.style, {
        width: "40px",
        height: "40px",
        border: "1px solid white",
        color: "white",
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      });
      if (
        selectedSlot &&
        selectedSlot.type === "inventory" &&
        selectedSlot.index === i
      ) {
        div.style.outline = "2px solid yellow";
      }
      if (slot.item) {
        if (itemIcons[slot.item]) {
          const img = document.createElement("img");
          img.src = itemIcons[slot.item];
          img.style.width = "32px";
          img.style.height = "32px";
          div.appendChild(img);
        } else {
          div.textContent = "?";
        }
        if (slot.count > 1) {
          const count = document.createElement("span");
          count.textContent = slot.count;
          Object.assign(count.style, {
            position: "absolute",
            bottom: "0",
            right: "2px",
            fontSize: "10px",
          });
          div.appendChild(count);
        }
        const { remaining, max } = getItemCooldown(
          slot.item,
          player,
          fireballCooldown,
        );
        if (max > 0 && remaining > 0) {
          const deg = (remaining / max) * 360;
          const overlay = document.createElement("div");
          Object.assign(overlay.style, {
            position: "absolute",
            inset: "0",
            borderRadius: "2px",
            pointerEvents: "none",
            background: `conic-gradient(from -90deg, rgba(128,128,128,0.6) 0deg ${deg}deg, transparent ${deg}deg 360deg)`,
          });
          div.appendChild(overlay);
        }
      }
      div.addEventListener("mousedown", () => {
        if (!selectedSlot) {
          selectedSlot = { type: "inventory", index: i };
        } else {
          if (selectedSlot.type === "inventory") {
            moveItem(inventory, selectedSlot.index, i);
          } else {
            swapInventoryHotbar(i, selectedSlot.index);
          }
          selectedSlot = null;
        }
        renderInventory(
          inventory,
          player,
          fireballCooldown,
          itemIcons,
          getItemCooldown,
        );
        renderHotbar(
          inventory,
          player,
          fireballCooldown,
          itemIcons,
          getItemCooldown,
        );
      });
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const slot = inventory.slots[i];
        if (!slot.item) return;
        const idx = inventory.hotbar.findIndex((s) => !s.item);
        if (idx !== -1) {
          moveToHotbar(i, idx);
          selectedSlot = null;
          renderInventory(
            inventory,
            player,
            fireballCooldown,
            itemIcons,
            getItemCooldown,
          );
          renderHotbar(
            inventory,
            player,
            fireballCooldown,
            itemIcons,
            getItemCooldown,
          );
        }
      });
      inventoryGrid.appendChild(div);
    });
  }

  function renderHotbar(
    inventory,
    player,
    fireballCooldown,
    itemIcons,
    getItemCooldown,
  ) {
    hotbarDiv.innerHTML = "";
    inventory.hotbar.forEach((slot, i) => {
      const div = document.createElement("div");
      Object.assign(div.style, {
        width: "40px",
        height: "40px",
        border: "1px solid white",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      });
      if (
        selectedSlot &&
        selectedSlot.type === "hotbar" &&
        selectedSlot.index === i
      ) {
        div.style.outline = "2px solid yellow";
      }
      if (slot.item) {
        if (itemIcons[slot.item]) {
          const img = document.createElement("img");
          img.src = itemIcons[slot.item];
          img.style.width = "32px";
          img.style.height = "32px";
          div.appendChild(img);
        } else {
          div.textContent = "?";
        }
        if (slot.count > 1) {
          const count = document.createElement("span");
          count.textContent = slot.count;
          Object.assign(count.style, {
            position: "absolute",
            bottom: "0",
            right: "2px",
            fontSize: "10px",
          });
          div.appendChild(count);
        }
        const { remaining, max } = getItemCooldown(
          slot.item,
          player,
          fireballCooldown,
        );
        if (max > 0 && remaining > 0) {
          const deg = (remaining / max) * 360;
          const overlay = document.createElement("div");
          Object.assign(overlay.style, {
            position: "absolute",
            inset: "0",
            borderRadius: "2px",
            pointerEvents: "none",
            background: `conic-gradient(from -90deg, rgba(128,128,128,0.6) 0deg ${deg}deg, transparent ${deg}deg 360deg)`,
          });
          div.appendChild(overlay);
        }
      }
      if (i === inventory.active) {
        div.style.borderColor = "yellow";
      }
      div.addEventListener("mousedown", () => {
        if (!selectedSlot) {
          selectedSlot = { type: "hotbar", index: i };
        } else {
          if (selectedSlot.type === "hotbar") {
            swapHotbar(selectedSlot.index, i);
          } else {
            swapInventoryHotbar(selectedSlot.index, i);
          }
          selectedSlot = null;
        }
        renderInventory(
          inventory,
          player,
          fireballCooldown,
          itemIcons,
          getItemCooldown,
        );
        renderHotbar(
          inventory,
          player,
          fireballCooldown,
          itemIcons,
          getItemCooldown,
        );
      });
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const idx = inventory.slots.findIndex((s) => !s.item);
        if (idx !== -1) {
          moveFromHotbar(i, idx);
          selectedSlot = null;
          renderInventory(
            inventory,
            player,
            fireballCooldown,
            itemIcons,
            getItemCooldown,
          );
          renderHotbar(
            inventory,
            player,
            fireballCooldown,
            itemIcons,
            getItemCooldown,
          );
        }
      });
      hotbarDiv.appendChild(div);
    });
  }

  function toggleInventory(flag) {
    if (flag === open) return;
    open = flag;
    if (open) {
      if (inventoryPos.left !== null) {
        inventoryDiv.style.left = inventoryPos.left + "px";
        inventoryDiv.style.top = inventoryPos.top + "px";
        inventoryDiv.style.transform = "none";
      } else {
        inventoryDiv.style.left = "50%";
        inventoryDiv.style.top = "50%";
        inventoryDiv.style.transform = "translate(-50%, -50%)";
      }
      inventoryDiv.style.display = "block";
    } else {
      inventoryPos.left = inventoryDiv.offsetLeft;
      inventoryPos.top = inventoryDiv.offsetTop;
      inventoryDiv.style.display = "none";
    }
  }

  return { renderInventory, renderHotbar, toggleInventory, isOpen: () => open };
}
