"""Holds the authoritative game state on the server."""

from typing import Any, Dict

from fastapi import WebSocket

from .models import GameState, PlayerState


class GameManager:
    """Manage players and expose the current game state."""

    def __init__(self) -> None:
        self.state = GameState(players={})
        # Track active WebSocket connections for broadcasting state
        self.connections: Dict[str, WebSocket] = {}

    def add_player(self, player_id: str, websocket: WebSocket) -> None:
        """Add a new player to the game with default state and store connection."""

        self.state.players[player_id] = PlayerState(x=0.0, y=0.0, facing="down")
        self.connections[player_id] = websocket

    def remove_player(self, player_id: str) -> None:
        """Remove a player from the game if present and drop connection."""

        self.state.players.pop(player_id, None)
        self.connections.pop(player_id, None)

    def update_player_state(self, player_id: str, input_data: Dict[str, Any]) -> None:
        """Update the player's state using the received input."""

        player = self.state.players.get(player_id)
        if not player:
            return

        # Movement can be expressed either as a single direction string or as
        # explicit deltas. Support both formats so older clients continue to
        # work while newer clients can send more granular values.
        speed = 2
        if input_data.get("action") == "move":
            if "moveX" in input_data or "moveY" in input_data:
                # Client provided delta values. Use them directly.
                player.x += float(input_data.get("moveX", 0))
                player.y += float(input_data.get("moveY", 0))
            else:
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

    def get_connections(self) -> Dict[str, WebSocket]:
        """Return the current active websocket connections."""

        return self.connections


# Single global instance used by API routes
manager = GameManager()
