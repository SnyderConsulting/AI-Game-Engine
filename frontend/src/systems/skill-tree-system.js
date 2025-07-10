export function upgradeFireball(player, inventory, addItem, moveToHotbar) {
  const level = player.abilities.fireballLevel || 0;
  const costs = [0, 2, 2, 3];
  if (level >= 3) return false;
  const cost = costs[level + 1];
  if (player.fireMutationPoints < cost) return false;
  player.fireMutationPoints -= cost;
  player.abilities.fireball = true;
  player.abilities.fireballLevel = level + 1;
  if (level === 0) {
    if (
      !inventory.hotbar.some((s) => s.item === "fireball_spell") &&
      !inventory.slots.some((s) => s.item === "fireball_spell")
    ) {
      const added = addItem(inventory, "fireball_spell", 1);
      if (added) {
        const idx = inventory.slots.findIndex(
          (s) => s.item === "fireball_spell",
        );
        if (idx !== -1) moveToHotbar(inventory, idx, 0);
      }
    }
  }
  return true;
}

export function upgradeFireOrb(player) {
  const level = player.abilities.fireOrbLevel || 0;
  const costs = [0, 1, 2, 3];
  if (level >= 3) return false;
  const cost = costs[level + 1];
  if (player.fireMutationPoints < cost) return false;
  player.fireMutationPoints -= cost;
  player.abilities.fireOrb = true;
  player.abilities.fireOrbLevel = level + 1;
  return true;
}

export function upgradePhoenixRevival(player) {
  const level = player.abilities.phoenixRevivalLevel || 0;
  const costs = [0, 4, 3, 4];
  if (level >= 3) return false;
  const cost = costs[level + 1];
  if (player.fireMutationPoints < cost) return false;
  player.fireMutationPoints -= cost;
  player.abilities.phoenixRevival = true;
  player.abilities.phoenixRevivalLevel = level + 1;
  return true;
}

export const SKILL_INFO = [
  {
    id: "fire_orb_skill",
    name: "Fire Orbs",
    description:
      "Summon a flaming orb that circles you and damages zombies on contact.",
    levelKey: "fireOrbLevel",
    max: 3,
    costs: [0, 1, 2, 3],
    levels: [
      { effect: "1 orb circles player (base level)", cost: 1 },
      { effect: "Adds a second orb", cost: 2 },
      { effect: "Reduce orb respawn cooldown by 50%", cost: 3 },
    ],
  },
  {
    id: "fireball_spell",
    name: "Fireball",
    description:
      "Hurl a blazing projectile that explodes when it hits a target.",
    levelKey: "fireballLevel",
    max: 3,
    costs: [0, 2, 2, 3],
    levels: [
      { effect: "Moderate damage, small explosion", cost: 2 },
      { effect: "Increased damage & explosion radius (+25%)", cost: 2 },
      { effect: "Greatly increased radius (+50%), pierces 1 zombie", cost: 3 },
    ],
  },
  {
    id: "phoenix_revival_skill",
    name: "Phoenix Revival",
    description:
      "Cheat death and revive with a brief damage buff when you would die.",
    levelKey: "phoenixRevivalLevel",
    max: 3,
    costs: [0, 4, 3, 4],
    levels: [
      { effect: "Revive at 10% HP, +25% dmg boost (5 sec)", cost: 4 },
      { effect: "Revive at 30% HP, +35% dmg boost (8 sec)", cost: 3 },
      { effect: "Revive at 50% HP, +50% dmg boost (12 sec)", cost: 4 },
    ],
  },
];

export const SKILL_UPGRADERS = {
  fire_orb_skill: (player) => upgradeFireOrb(player),
  fireball_spell: (player, inventory, addItem, moveToHotbar) =>
    upgradeFireball(player, inventory, addItem, moveToHotbar),
  phoenix_revival_skill: (player) => upgradePhoenixRevival(player),
};
