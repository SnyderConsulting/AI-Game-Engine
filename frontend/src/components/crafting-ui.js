import { countItem } from "../systems/inventory-system.js";
import { RECIPES, canCraft } from "../systems/crafting-system.js";

/**
 * Build and manage the crafting menu UI.
 *
 * @param {object} elements - DOM references used by the UI.
 * @param {HTMLElement} elements.craftingDiv - Root crafting element.
 * @param {HTMLElement} elements.craftingList - Container for recipe entries.
 * @param {HTMLElement} elements.craftingBar - Draggable bar element.
 * @param {HTMLElement} elements.craftingClose - Close button element.
 * @param {{left:number|null,top:number|null}} elements.craftingPos - Saved menu position.
 * @param {object} callbacks - Rendering callbacks.
 * @param {Function} callbacks.renderInventory - Rerender the inventory UI.
 * @param {Function} callbacks.renderHotbar - Rerender the hotbar UI.
 * @param {Function} sendCraftMessage - Function used to notify the server when crafting.
 * @returns {{renderCrafting:Function,toggleCrafting:Function,isOpen:Function}}
 *   Helper methods for controlling the crafting UI.
 */
export function createCraftingUI(
  { craftingDiv, craftingList, craftingBar, craftingClose, craftingPos },
  { renderInventory, renderHotbar },
  sendCraftMessage,
) {
  let open = false;

  function renderCrafting(inventory, player, itemIcons, worldItems) {
    craftingList.innerHTML = "";
    RECIPES.forEach((r) => {
      const hasAny = Object.keys(r.ingredients).some(
        (id) => countItem(inventory, id) > 0,
      );
      if (!hasAny) return;
      const container = document.createElement("div");
      container.style.border = "1px solid white";
      container.style.padding = "4px";
      container.style.marginBottom = "4px";
      container.style.display = "flex";
      container.style.gap = "6px";

      const icon = document.createElement("img");
      if (itemIcons[r.id]) {
        const src = itemIcons[r.id];
        icon.src = typeof src === "string" ? src : src.src;
      }
      icon.style.width = "40px";
      icon.style.height = "40px";
      container.appendChild(icon);

      const info = document.createElement("div");
      const title = document.createElement("div");
      title.textContent = r.title;
      title.style.fontWeight = "bold";
      info.appendChild(title);
      const desc = document.createElement("div");
      desc.textContent = r.description;
      info.appendChild(desc);

      const req = document.createElement("div");
      Object.entries(r.ingredients).forEach(([id, qty]) => {
        const line = document.createElement("div");
        const ingIcon = document.createElement("img");
        if (itemIcons[id]) {
          const src = itemIcons[id];
          ingIcon.src = typeof src === "string" ? src : src.src;
        }
        ingIcon.style.width = "16px";
        ingIcon.style.height = "16px";
        ingIcon.style.marginRight = "4px";
        line.appendChild(ingIcon);
        const text = document.createElement("span");
        text.textContent = `${countItem(inventory, id)}/${qty}`;
        line.appendChild(text);
        req.appendChild(line);
      });
      info.appendChild(req);
      container.appendChild(info);
      if (canCraft(inventory, r)) {
        container.style.cursor = "pointer";
        container.addEventListener("click", () => {
          if (typeof sendCraftMessage === "function") {
            sendCraftMessage(r.id);
          }
        });
      }
      craftingList.appendChild(container);
    });
  }

  function toggleCrafting(openFlag, inventory, player, itemIcons, worldItems) {
    if (openFlag === open) return;
    open = openFlag;
    if (open) {
      if (craftingPos.left !== null) {
        craftingDiv.style.left = craftingPos.left + "px";
        craftingDiv.style.top = craftingPos.top + "px";
        craftingDiv.style.transform = "none";
      } else {
        craftingDiv.style.left = "50%";
        craftingDiv.style.top = "50%";
        craftingDiv.style.transform = "translate(-50%, -50%)";
      }
      craftingDiv.style.display = "block";
      renderCrafting(inventory, player, itemIcons, worldItems);
    } else {
      craftingPos.left = craftingDiv.offsetLeft;
      craftingPos.top = craftingDiv.offsetTop;
      craftingDiv.style.display = "none";
    }
  }

  return { renderCrafting, toggleCrafting, isOpen: () => open };
}
