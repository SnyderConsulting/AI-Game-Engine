export const ZOMBIE_DROPS = [
  { type: "core", chance: 0.1 },
  { type: "flesh", chance: 0.8 },
  { type: "teeth", chance: 0.4 },
];

export function dropLoot(zombie, worldItems) {
  if (!zombie) return;
  if (zombie.variant === "fire" && Math.random() < 0.75) {
    worldItems.push({ x: zombie.x, y: zombie.y, type: "fire_core", count: 1 });
  }
  ZOMBIE_DROPS.forEach((d) => {
    if (Math.random() < d.chance) {
      worldItems.push({ x: zombie.x, y: zombie.y, type: d.type, count: 1 });
    }
  });
}
