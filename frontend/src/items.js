export const CONSUMABLE_ITEMS = new Set(["medkit", "mutation_serum_fire"]);

import { PLAYER_MAX_HEALTH } from "./game_logic.js";

export function applyConsumableEffect(player, itemId) {
  if (itemId === "medkit") {
    player.health = Math.min(PLAYER_MAX_HEALTH, player.health + 3);
    return true;
  }
  if (itemId === "mutation_serum_fire") {
    player.fireMutationPoints += 1;
    return true;
  }
  return false;
}
