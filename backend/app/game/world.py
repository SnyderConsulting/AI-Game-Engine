"""Server-side world generation and AI logic."""

from __future__ import annotations

import math
import random
from typing import List, Tuple

from .models import (
    CONTAINER_LOOT,
    WALL_MATERIALS,
    ContainerState,
    PlayerState,
    WallState,
    ZombieState,
)

SEGMENT_SIZE = 40
FIRE_ZOMBIE_CHANCE = 0.2
ZOMBIE_WAVE_SIZE = 5


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


def create_spawn_door(width: int, height: int, walls: List[WallState]) -> dict:
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
    return door


def create_zombie(x: float, y: float, variant: str = "normal") -> ZombieState:
    return ZombieState(x=x, y=y, variant=variant)


def spawn_zombie_wave(
    count: int,
    door: dict,
    width: int,
    height: int,
    variant: str = "normal",
    walls: List[WallState] | None = None,
) -> List[ZombieState]:
    walls = walls or []
    spawn_x = min(max(door["x"], 1), width - 1)
    spawn_y = min(max(door["y"], 1), height - 1)
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
) -> Tuple[List[WallState], List[ZombieState], List[ContainerState], dict]:
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


def update_zombies(
    zombies: List[ZombieState],
    players: List[PlayerState],
    walls: List[WallState],
    width: int,
    height: int,
) -> None:
    """Move zombies a small step toward the nearest player."""

    if not players:
        return

    for z in zombies:
        target = min(players, key=lambda p: (p.x - z.x) ** 2 + (p.y - z.y) ** 2)
        dx = target.x - z.x
        dy = target.y - z.y
        dist = math.hypot(dx, dy)
        if dist == 0:
            continue
        step = 1
        z.x += (dx / dist) * step
        z.y += (dy / dist) * step
        z.facing_x = dx / dist
        z.facing_y = dy / dist
        z.x = max(0, min(width, z.x))
        z.y = max(0, min(height, z.y))
