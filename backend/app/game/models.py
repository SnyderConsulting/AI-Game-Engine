from pydantic import BaseModel
from typing import Dict


class PlayerState(BaseModel):
    """State for a single connected player."""

    x: float
    y: float
    facing: str


class GameState(BaseModel):
    """Container for the entire game world state."""

    players: Dict[str, PlayerState] = {}
