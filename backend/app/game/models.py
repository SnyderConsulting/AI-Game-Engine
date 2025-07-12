"""Pydantic models describing the authoritative world state."""

from pydantic import BaseModel
from typing import Dict, List


class WallState(BaseModel):
    """State for a single wall segment."""

    x: float
    y: float
    size: int
    material: str


class ZombieState(BaseModel):
    """State for an AI controlled zombie."""

    x: float
    y: float
    facing_x: float
    facing_y: float


class PlayerState(BaseModel):
    """State for a single connected player."""

    x: float
    y: float
    facing_x: float
    facing_y: float


class GameState(BaseModel):
    """Container for the entire game world state."""

    players: Dict[str, PlayerState] = {}
    zombies: List[ZombieState] = []
    walls: List[WallState] = []
    width: int = 800
    height: int = 600
