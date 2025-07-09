export const CONSUMABLE_ITEMS = new Set(["medkit", "mutation_serum_fire"]);

export const ITEM_ICONS = {
  core: "assets/zombie_core.png",
  flesh: "assets/zombie_flesh.png",
  teeth: "assets/zombie_teeth.png",
  zombie_essence: "assets/zombie_essence.png",
  elemental_potion: "assets/elemental_potion.png",
  transformation_syringe: "assets/transformation_syringe.png",
  fire_core: "assets/fire_core.png",
  mutation_serum_fire: "assets/mutation_serum_fire.png",
  fireball_spell: "assets/skill_fireball.png",
  fire_orb_skill: "assets/skill_fire_orb.png",
  phoenix_revival_skill: "assets/skill_phoenix_revival.png",
  baseball_bat: "assets/baseball_bat.png",
  medkit: "assets/medkit.png",
  wood: "assets/wood.png",
  bow: "assets/wooden_bow.png",
  arrow: "assets/wooden_arrow.png",
  scrap_metal: "assets/scrap_metal.png",
  duct_tape: "assets/duct_tape.png",
  nails: "assets/nails.png",
  plastic_fragments: "assets/plastic_fragments.png",
  wood_planks: "assets/wood_planks.png",
  steel_plates: "assets/steel_plates.png",
  hammer: "assets/hammer.png",
  crowbar: "assets/crowbar.png",
  axe: "assets/axe.png",
  reinforced_axe: "assets/reinforced_axe.png",
  wood_barricade: "assets/wood_barricade.png",
};

export const ITEM_IDS = Object.keys(ITEM_ICONS);

// Items considered basic crafting materials for shelves and recipes
export const CRAFTING_MATERIALS = [
  "scrap_metal",
  "duct_tape",
  "nails",
  "plastic_fragments",
  "wood_planks",
  "steel_plates",
];

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
