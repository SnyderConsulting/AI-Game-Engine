"""Holds the authoritative game state on the server."""

from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import WebSocket
import random
import math

from .models import CONTAINER_LOOT, GameState, PlayerState
from .world import generate_world, spawn_player, update_zombies


class GameSession:
    """A single game session with its own state and connections."""

    def __init__(self) -> None:
        self.state = GameState(players={})
        walls, zombies, containers, door = generate_world(
            self.state.width, self.state.height
        )
        self.state.walls = walls
        self.state.zombies = zombies
        self.state.containers = containers
        self.spawn_door = door
        # Track active WebSocket connections for broadcasting state
        self.connections: Dict[str, WebSocket] = {}

    def add_player(self, websocket: WebSocket) -> str:
        """Add a new player with a unique ID and store the WebSocket connection.

        Returns
        -------
        str
            The generated player ID.
        """

        player_id = str(uuid4())
        x, y = spawn_player(self.state.width, self.state.height, self.state.walls)
        self.state.players[player_id] = PlayerState(
            x=x,
            y=y,
            facing_x=0.0,
            facing_y=1.0,
        )
        self.connections[player_id] = websocket
        return player_id

    def remove_player(self, player_id: str) -> None:
        """Remove a player from the game if present and drop connection."""

        self.state.players.pop(player_id, None)
        self.connections.pop(player_id, None)

    def update_world(self) -> None:
        """Advance the game simulation one step."""

        update_zombies(
            self.state.zombies,
            list(self.state.players.values()),
            self.state.walls,
            self.state.width,
            self.state.height,
        )
        for player in self.state.players.values():
            if player.damage_cooldown > 0:
                player.damage_cooldown -= 1
        for zombie in self.state.zombies:
            if zombie.attack_cooldown > 0:
                zombie.attack_cooldown -= 1
            for player in self.state.players.values():
                dist = math.hypot(player.x - zombie.x, player.y - zombie.y)
                if dist < 16 and zombie.attack_cooldown == 0:
                    if player.damage_cooldown == 0:
                        player.health = max(0, player.health - 1)
                        player.damage_cooldown = 30
                    zombie.attack_cooldown = 30

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
        elif input_data.get("action") == "loot":
            cid = input_data.get("containerId")
            for c in self.state.containers:
                if c.id == cid and not c.opened:
                    c.opened = True
                    c.item = random.choice(CONTAINER_LOOT)
                    break

        facing_x = input_data.get("facingX")
        facing_y = input_data.get("facingY")
        if facing_x is not None and facing_y is not None:
            player.facing_x = float(facing_x)
            player.facing_y = float(facing_y)

    def get_game_state(self) -> GameState:
        """Return the current game state."""

        return self.state

    def get_connections(self) -> Dict[str, WebSocket]:
        """Return the current active websocket connections."""

        return self.connections


class GameManager:
    """Manage multiple game sessions."""

    def __init__(self) -> None:
        # Map of game_id -> GameSession
        self.game_sessions: Dict[str, GameSession] = {}

    def create_game_session(self) -> str:
        """Create a new ``GameSession`` and return its ID."""

        game_id = str(uuid4())
        self.game_sessions[game_id] = GameSession()
        return game_id

    def get_session(self, game_id: str) -> Optional[GameSession]:
        """Return the session matching ``game_id`` if it exists."""

        return self.game_sessions.get(game_id)

    def get_all_sessions(self) -> Dict[str, GameSession]:
        """Return all active game sessions."""

        return self.game_sessions


# Single global instance used by API routes
manager = GameManager()
