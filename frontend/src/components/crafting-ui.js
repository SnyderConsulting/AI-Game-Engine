import { countItem } from "../systems/inventory-system.js";
import { RECIPES, canCraft, craftRecipe } from "../systems/crafting-system.js";

export function createCraftingUI(
  { craftingDiv, craftingList, craftingBar, craftingClose, craftingPos },
  { renderInventory, renderHotbar },
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
        icon.src = itemIcons[r.id];
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
        if (itemIcons[id]) ingIcon.src = itemIcons[id];
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
          const added = craftRecipe(inventory, r);
          if (!added && worldItems) {
            worldItems.push({ x: player.x, y: player.y, type: r.id, count: 1 });
          }
          if (renderInventory) renderInventory();
          renderCrafting(inventory, player, itemIcons, worldItems);
          if (renderHotbar) renderHotbar();
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
