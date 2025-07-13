"""Pydantic models describing the authoritative world state."""

from __future__ import annotations

from typing import Dict, List, Optional
from uuid import uuid4
from pydantic import Field

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Item definitions
# ---------------------------------------------------------------------------

CONSUMABLE_ITEMS = {"medkit", "mutation_serum_fire"}
ITEM_IDS = [
    "core",
    "flesh",
    "teeth",
    "zombie_essence",
    "elemental_potion",
    "transformation_syringe",
    "fire_core",
    "mutation_serum_fire",
    "fireball_spell",
    "fire_orb_skill",
    "phoenix_revival_skill",
    "baseball_bat",
    "medkit",
    "wood",
    "bow",
    "arrow",
    "scrap_metal",
    "duct_tape",
    "nails",
    "plastic_fragments",
    "wood_planks",
    "steel_plates",
    "hammer",
    "crowbar",
    "axe",
    "reinforced_axe",
    "wood_barricade",
]

# ---------------------------------------------------------------------------
# Wall definitions
# ---------------------------------------------------------------------------

WALL_MATERIALS = {
    "steel": {"hp": 30},
    "wood": {"hp": 20},
    "plastic": {"hp": 10},
}


class WallState(BaseModel):
    """State for a single wall segment."""

    x: float
    y: float
    size: int
    material: str
    hp: int
    max_hp: int
    damage_timer: int = 0
    opened: bool = False
    item: Optional[str] = None


# ---------------------------------------------------------------------------
# Zombie definitions
# ---------------------------------------------------------------------------

ZOMBIE_MAX_HEALTH = 2


class ZombieState(BaseModel):
    """State for an AI controlled zombie."""

    x: float
    y: float
    facing_x: float = 0.0
    facing_y: float = 1.0
    triggered: bool = False
    dest: Optional[Dict[str, float]] = None
    idle_timer: int = 0
    wander_angle: float = 0.0
    wander_timer: int = 0
    health: int = ZOMBIE_MAX_HEALTH
    attack_cooldown: int = 0
    variant: str = "normal"


# ---------------------------------------------------------------------------
# Player definitions
# ---------------------------------------------------------------------------

PLAYER_MAX_HEALTH = 10


class PlayerAbilities(BaseModel):
    fireball: bool = False
    fireballLevel: int = 0
    fireOrb: bool = False
    fireOrbLevel: int = 0
    phoenixRevival: bool = False
    phoenixRevivalLevel: int = 0


class PlayerState(BaseModel):
    """State for a single connected player."""

    x: float
    y: float
    facing_x: float = 1.0
    facing_y: float = 0.0
    speed: float = 2.0
    health: int = PLAYER_MAX_HEALTH
    damage_cooldown: int = 0
    weapon: Optional[str] = None
    swing_timer: int = 0
    abilities: PlayerAbilities = PlayerAbilities()
    fire_mutation_points: int = 0
    phoenix_cooldown: int = 0
    damage_buff_timer: int = 0
    damage_buff_mult: float = 1.0
    inventory: Dict[str, int] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Container definitions
# ---------------------------------------------------------------------------

CONTAINER_LOOT = ["scrap_metal", "duct_tape", "nails", "medkit"]

# Items that may appear when searching shelves.
CRAFTING_MATERIALS = [
    "scrap_metal",
    "duct_tape",
    "nails",
    "plastic_fragments",
    "wood_planks",
    "steel_plates",
]

# Chance that a shelf contains an item when opened.
SHELF_LOOT_CHANCE = 0.2


class ContainerState(BaseModel):
    """Lootable container such as a cardboard box."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    x: float
    y: float
    opened: bool = False
    item: Optional[str] = None
    type: str = "cardboard_box"


class DoorState(BaseModel):
    """Simple spawn door descriptor."""

    x: float
    y: float


# ---------------------------------------------------------------------------
# Game state container
# ---------------------------------------------------------------------------


class GameState(BaseModel):
    """Container for the entire game world state."""

    players: Dict[str, PlayerState] = {}
    zombies: List[ZombieState] = []
    walls: List[WallState] = []
    containers: List[ContainerState] = []
    door: DoorState | None = None
    width: int = 2400
    height: int = 1600
    # Remaining loot timer ticks for each player
    loot_progress: Dict[str, int] = Field(default_factory=dict)
