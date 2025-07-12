"""Server-side world generation and AI logic."""

from __future__ import annotations

import math
import random
from typing import List, Tuple

from .models import WallState, ZombieState, PlayerState

SEGMENT_SIZE = 40


def generate_world(
    width: int, height: int
) -> Tuple[List[WallState], List[ZombieState], dict]:
    """Create the initial walls, zombies and spawn door."""

    walls: List[WallState] = []
    grid_w = width // SEGMENT_SIZE
    grid_h = height // SEGMENT_SIZE

    for x in range(grid_w):
        walls.append(
            WallState(x=x * SEGMENT_SIZE, y=0, size=SEGMENT_SIZE, material="steel")
        )
        walls.append(
            WallState(
                x=x * SEGMENT_SIZE,
                y=(grid_h - 1) * SEGMENT_SIZE,
                size=SEGMENT_SIZE,
                material="steel",
            )
        )
    for y in range(grid_h):
        walls.append(
            WallState(x=0, y=y * SEGMENT_SIZE, size=SEGMENT_SIZE, material="steel")
        )
        walls.append(
            WallState(
                x=(grid_w - 1) * SEGMENT_SIZE,
                y=y * SEGMENT_SIZE,
                size=SEGMENT_SIZE,
                material="steel",
            )
        )

    door = {"x": width / 2, "y": SEGMENT_SIZE}
    zombies = [ZombieState(x=door["x"], y=door["y"], facing_x=0, facing_y=1)]

    return walls, zombies, door


def spawn_player(
    width: int, height: int, walls: List[WallState]
) -> Tuple[float, float]:
    """Return a random open position for a new player."""

    while True:
        x = random.random() * width
        y = random.random() * height
        colliding = any(
            w.x <= x <= w.x + w.size and w.y <= y <= w.y + w.size for w in walls
        )
        if not colliding:
            return x, y


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
