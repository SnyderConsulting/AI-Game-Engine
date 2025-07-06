export const RECIPES = [
  {
    id: "zombie_essence",
    title: "Zombie Essence",
    description: "Distilled from zombie parts.",
    ingredients: { flesh: 1, teeth: 1 },
  },
  {
    id: "elemental_potion",
    title: "Elemental Potion",
    description: "Magic energy brew.",
    ingredients: { zombie_essence: 1, magic_essence: 1 },
  },
  {
    id: "transformation_syringe",
    title: "Transformation Syringe",
    description: "Inject to transform a zombie.",
    ingredients: { zombie_core: 1, elemental_potion: 1 },
  },
  {
    id: "mutation_serum_fire",
    title: "Fire Mutation Serum",
    description: "Unlocks the Fireball ability.",
    ingredients: { fire_core: 3 },
  },
];

import { addItem, countItem, removeItem } from "./inventory.js";

export function canCraft(inv, recipe) {
  return Object.entries(recipe.ingredients).every(
    ([id, qty]) => countItem(inv, id) >= qty,
  );
}

export function craftRecipe(inv, recipe) {
  if (!canCraft(inv, recipe)) return false;
  Object.entries(recipe.ingredients).forEach(([id, qty]) => {
    removeItem(inv, id, qty);
  });
  return addItem(inv, recipe.id, 1);
}
