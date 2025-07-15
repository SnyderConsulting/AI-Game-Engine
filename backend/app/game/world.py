"""Server-side world generation and AI logic."""

from __future__ import annotations

import math
import random
from typing import List, Tuple

from .models import (
    CONTAINER_LOOT,
    WALL_MATERIALS,
    ContainerState,
    DoorState,
    PlayerState,
    WallState,
    ZombieState,
)

SEGMENT_SIZE = 40
FIRE_ZOMBIE_CHANCE = 0.2
ZOMBIE_WAVE_SIZE = 5

# Recipes used for server-authoritative crafting. Each entry maps the
# resulting item id to the required ingredients and optional output
# quantity. When no output is specified the crafted item id is awarded
# in a quantity of one.
CRAFTING_RECIPES = {
    "zombie_essence": {"ingredients": {"flesh": 1, "teeth": 1}},
    "elemental_potion": {"ingredients": {"zombie_essence": 1, "magic_essence": 1}},
    "transformation_syringe": {
        "ingredients": {"zombie_core": 1, "elemental_potion": 1}
    },
    "mutation_serum_fire": {"ingredients": {"fire_core": 3}},
    "bow": {"ingredients": {"wood_planks": 3, "nails": 2}},
    "arrow": {
        "ingredients": {"wood_planks": 1, "nails": 1},
        "output": {"id": "arrow", "qty": 5},
    },
    "hammer": {"ingredients": {"scrap_metal": 2, "duct_tape": 1}},
    "crowbar": {"ingredients": {"scrap_metal": 3, "duct_tape": 1}},
    "axe": {"ingredients": {"scrap_metal": 4, "duct_tape": 2}},
    "baseball_bat": {"ingredients": {"wood_planks": 2, "duct_tape": 1}},
    "reinforced_axe": {"ingredients": {"steel_plates": 3, "wood_planks": 2}},
    "wood_barricade": {"ingredients": {"wood_planks": 2, "nails": 4}},
}


# ---------------------------------------------------------------------------
# World generation helpers
# ---------------------------------------------------------------------------


def create_wall(gx: int, gy: int, material: str | None = None) -> WallState:
    """Create a ``WallState`` at the given grid coordinate."""

    mat = material or random.choice(list(WALL_MATERIALS.keys()))
    hp = WALL_MATERIALS[mat]["hp"]
    return WallState(
        x=gx * SEGMENT_SIZE,
        y=gy * SEGMENT_SIZE,
        size=SEGMENT_SIZE,
        material=mat,
        hp=hp,
        max_hp=hp,
    )


def generate_store_walls(width: int, height: int) -> List[WallState]:
    """Generate the hardware store style layout."""

    walls: List[WallState] = []
    grid_w = width // SEGMENT_SIZE
    grid_h = height // SEGMENT_SIZE

    def clamp(v: int, mn: int, mx: int) -> int:
        return max(mn, min(mx, v))

    def add_vertical(gx: int, gy1: int, gy2: int) -> None:
        gx_c = clamp(gx, 0, grid_w - 1)
        gy1_c = clamp(gy1, 0, grid_h - 1)
        gy2_c = clamp(gy2, 0, grid_h - 1)
        for y in range(gy1_c, gy2_c + 1):
            walls.append(create_wall(gx_c, y))

    def add_horizontal(gy: int, gx1: int, gx2: int) -> None:
        gy_c = clamp(gy, 0, grid_h - 1)
        gx1_c = clamp(gx1, 0, grid_w - 1)
        gx2_c = clamp(gx2, 0, grid_w - 1)
        for x in range(gx1_c, gx2_c + 1):
            walls.append(create_wall(x, gy_c))

    def add_room(x: int, y: int, w: int, h: int) -> None:
        for gx in range(x, x + w):
            for gy in range(y, y + h):
                if gx == x + w // 2 and gy == y + h - 1:
                    continue
                if gx in (x, x + w - 1) or gy in (y, y + h - 1):
                    walls.append(create_wall(gx, gy))

    v_spacing = max(6, grid_w // 4)
    v_positions: List[int] = []
    for gx in range(2, grid_w - 2, v_spacing):
        v_positions.append(gx)
        y = 2
        while y < grid_h - 4:
            length = 4 + random.randint(0, 2)
            add_vertical(gx, y, min(y + length - 1, grid_h - 4))
            y += length + 3 + random.randint(0, 1)

    h_spacing = max(8, grid_h // 5)
    for gy in range(4, grid_h - 3, h_spacing):
        x = 2
        while x < grid_w - 4:
            length = 4 + random.randint(0, 2)
            add_horizontal(gy, x, min(x + length - 1, grid_w - 4))
            x += length + 4 + random.randint(0, 2)

    for gx in v_positions:
        if random.random() < 0.4:
            y = 2 + random.randint(0, max(1, grid_h - 8))
            add_horizontal(y, gx - 1, gx + 1)
            add_horizontal(y + 1, gx - 1, gx + 1)

    room_count = 1 + random.randint(0, 1)
    for _ in range(room_count):
        rw = min(3 + random.randint(0, 2), grid_w - 2)
        rh = min(3 + random.randint(0, 2), grid_h - 2)
        if rw < 3 or rh < 3:
            continue
        start_x = 1 + random.randint(0, grid_w - rw - 1)
        start_y = 1 + random.randint(0, grid_h - rh - 1)
        add_room(start_x, start_y, rw, rh)

    return walls


def random_open_position(
    width: int, height: int, walls: List[WallState]
) -> Tuple[float, float]:
    """Return a random position not colliding with walls."""

    attempts = 0
    while True:
        x = random.random() * width
        y = random.random() * height
        colliding = any(
            w.x <= x <= w.x + w.size and w.y <= y <= w.y + w.size for w in walls
        )
        if not colliding or attempts > 20:
            return x, y
        attempts += 1


def create_container(x: float, y: float) -> ContainerState:
    return ContainerState(x=x, y=y)


def spawn_containers(
    width: int, height: int, walls: List[WallState], count: int = 3
) -> List[ContainerState]:
    containers = []
    for _ in range(count):
        px, py = random_open_position(width, height, walls)
        containers.append(create_container(px, py))
    return containers


def create_spawn_door(width: int, height: int, walls: List[WallState]) -> DoorState:
    door = None
    inside = None
    while True:
        edge = random.randint(0, 3)
        if edge == 0:
            door = {"x": random.random() * width, "y": 0}
            inside = {"x": door["x"], "y": SEGMENT_SIZE}
        elif edge == 1:
            door = {"x": random.random() * width, "y": height}
            inside = {"x": door["x"], "y": height - SEGMENT_SIZE}
        elif edge == 2:
            door = {"x": 0, "y": random.random() * height}
            inside = {"x": SEGMENT_SIZE, "y": door["y"]}
        else:
            door = {"x": width, "y": random.random() * height}
            inside = {"x": width - SEGMENT_SIZE, "y": door["y"]}
        colliding = any(
            wall.x <= door["x"] <= wall.x + wall.size
            and wall.y <= door["y"] <= wall.y + wall.size
            for wall in walls
        ) or any(
            wall.x <= inside["x"] <= wall.x + wall.size
            and wall.y <= inside["y"] <= wall.y + wall.size
            for wall in walls
        )
        if not colliding:
            break
    return DoorState(x=door["x"], y=door["y"])


def create_zombie(x: float, y: float, variant: str = "normal") -> ZombieState:
    return ZombieState(x=x, y=y, variant=variant)


def spawn_zombie_wave(
    count: int,
    door: DoorState,
    width: int,
    height: int,
    variant: str = "normal",
    walls: List[WallState] | None = None,
) -> List[ZombieState]:
    walls = walls or []
    spawn_x = min(max(door.x, 1), width - 1)
    spawn_y = min(max(door.y, 1), height - 1)
    zombies: List[ZombieState] = []
    for _ in range(count):
        attempts = 0
        while True:
            angle = random.random() * math.pi * 2
            dist = random.random() * (SEGMENT_SIZE / 2)
            pos_x = min(max(spawn_x + math.cos(angle) * dist, 1), width - 1)
            pos_y = min(max(spawn_y + math.sin(angle) * dist, 1), height - 1)
            if not any(
                w.x <= pos_x <= w.x + w.size and w.y <= pos_y <= w.y + w.size
                for w in walls
            ) and not any(math.hypot(z.x - pos_x, z.y - pos_y) < 10 for z in zombies):
                zombies.append(create_zombie(pos_x, pos_y, variant))
                break
            attempts += 1
            if attempts > 20:
                break
    return zombies


# ---------------------------------------------------------------------------
# Public world generation entry points
# ---------------------------------------------------------------------------


def generate_world(
    width: int, height: int
) -> Tuple[List[WallState], List[ZombieState], List[ContainerState], DoorState]:
    """Create walls, zombies, containers and a spawn door."""

    walls = generate_store_walls(width, height)
    door = create_spawn_door(width, height, walls)
    zombies = spawn_zombie_wave(ZOMBIE_WAVE_SIZE, door, width, height, "normal", walls)
    containers = spawn_containers(width, height, walls)
    return walls, zombies, containers, door


def spawn_player(
    width: int, height: int, walls: List[WallState]
) -> Tuple[float, float]:
    """Return a random open position for a new player."""

    return random_open_position(width, height, walls)


def find_path(
    start: PlayerState | ZombieState,
    goal: PlayerState | ZombieState,
    walls: List[WallState],
    width: int,
    height: int,
    dynamic_blocks: List[Tuple[int, int]] | None = None,
) -> List[Tuple[int, int]]:
    """Return a grid path from ``start`` to ``goal`` avoiding walls.

    Parameters
    ----------
    start : PlayerState | ZombieState
        Entity representing the starting point.
    goal : PlayerState | ZombieState
        Entity representing the destination.
    walls : list[WallState]
        Impassable wall segments.
    width : int
        World width in pixels.
    height : int
        World height in pixels.
    dynamic_blocks : list[tuple[int, int]] | None, optional
        Additional temporary obstacles such as other zombies.

    Returns
    -------
    list[tuple[int, int]]
        Ordered list of grid coordinates starting at ``start`` and ending at
        ``goal``. An empty list is returned when no path exists.
    """

    grid_w = width // SEGMENT_SIZE
    grid_h = height // SEGMENT_SIZE
    sx = int(start.x // SEGMENT_SIZE)
    sy = int(start.y // SEGMENT_SIZE)
    gx = int(goal.x // SEGMENT_SIZE)
    gy = int(goal.y // SEGMENT_SIZE)

    blocked = {(int(w.x // SEGMENT_SIZE), int(w.y // SEGMENT_SIZE)) for w in walls}
    if dynamic_blocks:
        blocked.update(dynamic_blocks)

    queue: List[Tuple[int, int]] = [(sx, sy)]
    came_from: dict[Tuple[int, int], Tuple[int, int] | None] = {(sx, sy): None}
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]

    while queue:
        cx, cy = queue.pop(0)
        if (cx, cy) == (gx, gy):
            break
        for dx, dy in dirs:
            nx, ny = cx + dx, cy + dy
            if nx < 0 or ny < 0 or nx >= grid_w or ny >= grid_h:
                continue
            if (nx, ny) in blocked or (nx, ny) in came_from:
                continue
            came_from[(nx, ny)] = (cx, cy)
            queue.append((nx, ny))

    path: List[Tuple[int, int]] = []
    cur = (gx, gy)
    while cur in came_from and cur is not None:
        path.insert(0, cur)
        cur = came_from[cur]

    if not path or path[0] != (sx, sy):
        return []
    return path


def update_zombies(
    zombies: List[ZombieState],
    players: List[PlayerState],
    walls: List[WallState],
    width: int,
    height: int,
) -> None:
    """Move zombies toward the nearest player using basic pathfinding."""

    if not players:
        return

    for idx, z in enumerate(zombies):
        target = min(players, key=lambda p: (p.x - z.x) ** 2 + (p.y - z.y) ** 2)
        dynamic_blocks = {
            (int(o.x // SEGMENT_SIZE), int(o.y // SEGMENT_SIZE))
            for i, o in enumerate(zombies)
            if i != idx
        }
        path = find_path(z, target, walls, width, height, list(dynamic_blocks))
        if len(path) >= 2:
            nx, ny = path[1]
            target_x = nx * SEGMENT_SIZE + SEGMENT_SIZE / 2
            target_y = ny * SEGMENT_SIZE + SEGMENT_SIZE / 2
        else:
            target_x = target.x
            target_y = target.y

        dx = target_x - z.x
        dy = target_y - z.y
        dist = math.hypot(dx, dy)
        if dist == 0:
            continue

        step = 1.0
        new_x = z.x + (dx / dist) * step
        new_y = z.y + (dy / dist) * step
        colliding = any(
            w.x <= new_x <= w.x + w.size and w.y <= new_y <= w.y + w.size for w in walls
        )
        if not colliding:
            z.x = max(0, min(width, new_x))
            z.y = max(0, min(height, new_y))
        z.facing_x = dx / dist
        z.facing_y = dy / dist


def craft_item(player: PlayerState, item_id: str) -> bool:
    """Craft ``item_id`` for ``player`` if materials are available."""

    recipe = CRAFTING_RECIPES.get(item_id)
    if not recipe:
        return False
    for ing, qty in recipe["ingredients"].items():
        if player.inventory.get(ing, 0) < qty:
            return False

    for ing, qty in recipe["ingredients"].items():
        remaining = player.inventory.get(ing, 0) - qty
        if remaining <= 0:
            player.inventory.pop(ing, None)
        else:
            player.inventory[ing] = remaining

    output = recipe.get("output", {"id": item_id, "qty": 1})
    out_id = output["id"]
    out_qty = output.get("qty", 1)
    player.inventory[out_id] = player.inventory.get(out_id, 0) + out_qty
    return True


def use_item(player: PlayerState, item_id: str) -> bool:
    """Apply the effect of ``item_id`` if present in the player's inventory."""

    if player.inventory.get(item_id, 0) <= 0:
        return False

    from .models import PLAYER_MAX_HEALTH

    if item_id == "medkit":
        player.health = min(PLAYER_MAX_HEALTH, player.health + 3)
    elif item_id == "mutation_serum_fire":
        player.fire_mutation_points += 1
    else:
        player.weapon = item_id

    remaining = player.inventory.get(item_id, 0) - 1
    if remaining <= 0:
        player.inventory.pop(item_id, None)
    else:
        player.inventory[item_id] = remaining
    return True
