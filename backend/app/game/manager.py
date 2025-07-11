"""Holds the authoritative game state on the server."""

from typing import Any, Dict

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

    def update_player_state(self, player_id: str, input_data: Dict[str, Any]) -> None:
        """Update the player's state using the received input."""

        player = self.state.players.get(player_id)
        if not player:
            return

        speed = 5
        if input_data.get("action") == "move":
            direction = input_data.get("direction")
            if direction == "left":
                player.x -= speed
            elif direction == "right":
                player.x += speed
            elif direction == "up":
                player.y -= speed
            elif direction == "down":
                player.y += speed

        facing_x = input_data.get("facingX")
        facing_y = input_data.get("facingY")
        if facing_x is not None and facing_y is not None:
            if abs(facing_x) > abs(facing_y):
                player.facing = "right" if facing_x > 0 else "left"
            else:
                player.facing = "down" if facing_y > 0 else "up"

    def get_game_state(self) -> GameState:
        """Return the current game state."""

        return self.state


# Single global instance used by API routes
manager = GameManager()
