import {
  moveItem,
  moveToHotbar,
  moveFromHotbar,
  swapHotbar,
  swapInventoryHotbar,
} from "../systems/inventory-system.js";

/**
 * Build the inventory and hotbar UI components.
 *
 * @param {object} opts - Options container.
 * @param {HTMLElement} opts.inventoryDiv - Root inventory element.
 * @param {HTMLElement} opts.inventoryGrid - Grid element for inventory slots.
 * @param {HTMLElement} opts.hotbarDiv - Container for the hotbar slots.
 * @param {HTMLElement} opts.inventoryBar - Draggable inventory header.
 * @param {HTMLElement} opts.inventoryClose - Close button element.
 * @param {{left:number|null,top:number|null}} opts.inventoryPos - Saved position.
 * @returns {{renderInventory:Function,renderHotbar:Function,toggleInventory:Function,isOpen:Function}}
 *   UI helpers for rendering and toggling the inventory.
 */
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
      div.draggable = true;
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
          img.draggable = false;
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
            swapInventoryHotbar(inventory, i, selectedSlot.index);
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
      div.addEventListener("dragstart", (e) => {
        selectedSlot = { type: "inventory", index: i };
        e.dataTransfer.setData("text/plain", "");
      });
      div.addEventListener("dragover", (e) => e.preventDefault());
      div.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!selectedSlot) return;
        if (selectedSlot.type === "inventory") {
          moveItem(inventory, selectedSlot.index, i);
        } else {
          swapInventoryHotbar(inventory, i, selectedSlot.index);
        }
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
      });
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const slot = inventory.slots[i];
        if (!slot.item) return;
        const idx = inventory.hotbar.findIndex((s) => !s.item);
        if (idx !== -1) {
          moveToHotbar(inventory, i, idx);
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
      div.draggable = true;
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
          img.draggable = false;
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
            swapHotbar(inventory, selectedSlot.index, i);
          } else {
            swapInventoryHotbar(inventory, selectedSlot.index, i);
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
      div.addEventListener("dragstart", (e) => {
        selectedSlot = { type: "hotbar", index: i };
        e.dataTransfer.setData("text/plain", "");
      });
      div.addEventListener("dragover", (e) => e.preventDefault());
      div.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!selectedSlot) return;
        if (selectedSlot.type === "hotbar") {
          swapHotbar(inventory, selectedSlot.index, i);
        } else {
          swapInventoryHotbar(inventory, selectedSlot.index, i);
        }
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
      });
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const idx = inventory.slots.findIndex((s) => !s.item);
        if (idx !== -1) {
          moveFromHotbar(inventory, i, idx);
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
