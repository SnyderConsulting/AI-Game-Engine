export const STACK_LIMITS = {
  wood: 20,
  arrow: 20,
  scrap_metal: 20,
  duct_tape: 20,
  nails: 20,
  wood_planks: 20,
  plastic_fragments: 20,
  steel_plates: 20,
};

export function getStackLimit(itemId) {
  return STACK_LIMITS[itemId] || 10;
}

export function createInventory(rows = 5, cols = 5) {
  const slots = Array.from({ length: rows * cols }, () => ({
    item: null,
    count: 0,
  }));
  const hotbar = Array.from({ length: 5 }, () => ({ item: null, count: 0 }));
  return { rows, cols, slots, hotbar, active: 0 };
}

export function addItem(inv, itemId, amount = 1) {
  const limit = getStackLimit(itemId);
  // First fill existing stacks across hotbar and inventory
  for (const slot of [...inv.hotbar, ...inv.slots]) {
    if (slot.item === itemId && slot.count < limit) {
      const add = Math.min(amount, limit - slot.count);
      slot.count += add;
      amount -= add;
      if (amount === 0) return true;
    }
  }

  // Next place new stacks into open hotbar slots
  for (const slot of inv.hotbar) {
    if (!slot.item) {
      const add = Math.min(amount, limit);
      slot.item = itemId;
      slot.count = add;
      amount -= add;
      if (amount === 0) return true;
    }
  }

  // Finally fill empty inventory slots
  for (const slot of inv.slots) {
    if (!slot.item) {
      const add = Math.min(amount, limit);
      slot.item = itemId;
      slot.count = add;
      amount -= add;
      if (amount === 0) return true;
    }
  }

  return amount === 0;
}

export function moveItem(inv, fromIndex, toIndex) {
  const from = inv.slots[fromIndex];
  const to = inv.slots[toIndex];
  inv.slots[toIndex] = from;
  inv.slots[fromIndex] = to;
}

export function moveToHotbar(inv, fromIndex, hotbarIndex) {
  const slot = inv.slots[fromIndex];
  const dest = inv.hotbar[hotbarIndex];
  if (!slot.item || dest.item) return false;
  inv.hotbar[hotbarIndex] = slot;
  inv.slots[fromIndex] = { item: null, count: 0 };
  return true;
}

export function swapHotbar(inv, indexA, indexB) {
  const tmp = inv.hotbar[indexA];
  inv.hotbar[indexA] = inv.hotbar[indexB];
  inv.hotbar[indexB] = tmp;
}

export function swapInventoryHotbar(inv, invIndex, hotbarIndex) {
  const tmp = inv.slots[invIndex];
  inv.slots[invIndex] = inv.hotbar[hotbarIndex];
  inv.hotbar[hotbarIndex] = tmp;
}

export function moveFromHotbar(inv, hotbarIndex, invIndex) {
  const slot = inv.hotbar[hotbarIndex];
  inv.slots[invIndex] = slot;
  inv.hotbar[hotbarIndex] = { item: null, count: 0 };
}

export function consumeHotbarItem(inv, hotbarIndex) {
  const slot = inv.hotbar[hotbarIndex];
  if (!slot.item) return null;
  slot.count--;
  const item = slot.item;
  if (slot.count <= 0) {
    slot.item = null;
    slot.count = 0;
  }
  return item;
}

export function countItem(inv, itemId) {
  let total = 0;
  [...inv.slots, ...inv.hotbar].forEach((slot) => {
    if (slot.item === itemId) total += slot.count;
  });
  return total;
}

export function removeItem(inv, itemId, amount = 1) {
  for (const source of [inv.slots, inv.hotbar]) {
    for (const slot of source) {
      if (slot.item === itemId) {
        const take = Math.min(amount, slot.count);
        slot.count -= take;
        amount -= take;
        if (slot.count === 0) slot.item = null;
        if (amount === 0) return true;
      }
    }
  }
  return amount === 0;
}

export function setActiveHotbar(inv, index) {
  inv.active = Math.max(0, Math.min(inv.hotbar.length - 1, index));
}

export function getActiveHotbarItem(inv) {
  return inv.hotbar[inv.active];
}
