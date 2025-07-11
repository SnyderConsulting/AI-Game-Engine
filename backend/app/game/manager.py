"""Holds the authoritative game state on the server."""

from typing import Dict

from .models import GameState, PlayerState


class GameManager:
    """Manage players and expose the current game state."""

    def __init__(self) -> None:
        self.state = GameState(players={})

    def add_player(self, player_id: str) -> None:
        """Add a new player to the game with default state."""

        self.state.players[player_id] = PlayerState(x=0.0, y=0.0, facing="down")

    def remove_player(self, player_id: str) -> None:
        """Remove a player from the game if present."""

        self.state.players.pop(player_id, None)

    def get_game_state(self) -> GameState:
        """Return the current game state."""

        return self.state


# Single global instance used by API routes
manager = GameManager()
