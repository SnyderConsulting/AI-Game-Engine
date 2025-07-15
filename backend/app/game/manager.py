"""Holds the authoritative game state on the server."""

from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import WebSocket
import random
import math

from .models import (
    CONTAINER_LOOT,
    CRAFTING_MATERIALS,
    SHELF_LOOT_CHANCE,
    GameState,
    PlayerState,
)
from .world import generate_world, spawn_player, update_zombies

LOOT_TICKS = 180
INTERACT_RANGE = 20


def _wall_distance(px: float, py: float, wall) -> float:
    """Return the distance from point ``(px, py)`` to a wall's edge."""

    closest_x = max(wall.x, min(px, wall.x + wall.size))
    closest_y = max(wall.y, min(py, wall.y + wall.size))
    return math.hypot(px - closest_x, py - closest_y)


def _collides(x: float, y: float, walls) -> bool:
    """Return True if point ``(x, y)`` intersects a wall."""
    return any(w.x <= x <= w.x + w.size and w.y <= y <= w.y + w.size for w in walls)


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
        self.state.door = door
        # Track active WebSocket connections for broadcasting state
        self.connections: Dict[str, WebSocket] = {}
        # active looting timers
        self.loot_timers: Dict[str, Dict[str, Any]] = {}

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

        to_remove = []
        for pid, info in list(self.loot_timers.items()):
            target = info.get("container") or info.get("shelf")
            player = self.state.players.get(pid)
            if not player or target.opened:
                to_remove.append(pid)
                continue

            if "container" in info:
                in_range = (
                    math.hypot(player.x - target.x, player.y - target.y)
                    <= INTERACT_RANGE
                )
            else:
                in_range = _wall_distance(player.x, player.y, target) <= INTERACT_RANGE

            if not in_range:
                to_remove.append(pid)
                continue

            info["ticks"] -= 1
            if info["ticks"] <= 0:
                if "container" in info:
                    target.opened = True
                    target.item = random.choice(CONTAINER_LOOT)
                    item = target.item
                    if item:
                        player.inventory[item] = player.inventory.get(item, 0) + 1
                else:
                    if not target.opened:
                        if random.random() < SHELF_LOOT_CHANCE:
                            target.item = random.choice(CRAFTING_MATERIALS)
                        target.opened = True
                        if target.item:
                            item = target.item
                            player.inventory[item] = player.inventory.get(item, 0) + 1
                to_remove.append(pid)

        for pid in to_remove:
            self.loot_timers.pop(pid, None)

        self.state.loot_progress = {
            pid: info["ticks"] for pid, info in self.loot_timers.items()
        }

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
            if player.health <= 0:
                return
            dx = dy = 0.0
            if "moveX" in input_data or "moveY" in input_data:
                dx = float(input_data.get("moveX", 0))
                dy = float(input_data.get("moveY", 0))
            else:
                direction = input_data.get("direction")
                if direction == "left":
                    dx = -speed
                elif direction == "right":
                    dx = speed
                elif direction == "up":
                    dy = -speed
                elif direction == "down":
                    dy = speed

            new_x = player.x + dx
            new_y = player.y + dy

            if 0 <= new_x <= self.state.width and not _collides(
                new_x, player.y, self.state.walls
            ):
                player.x = new_x
            if 0 <= new_y <= self.state.height and not _collides(
                player.x, new_y, self.state.walls
            ):
                player.y = new_y
        elif input_data.get("action") == "start_looting":
            cid = input_data.get("containerId")
            if cid:
                for c in self.state.containers:
                    if c.id == cid and not c.opened:
                        dist = math.hypot(player.x - c.x, player.y - c.y)
                        if dist <= INTERACT_RANGE:
                            self.loot_timers[player_id] = {
                                "container": c,
                                "ticks": LOOT_TICKS,
                            }
                        break
            else:
                for w in self.state.walls:
                    if (
                        not w.opened
                        and _wall_distance(player.x, player.y, w) <= INTERACT_RANGE
                    ):
                        self.loot_timers[player_id] = {
                            "shelf": w,
                            "ticks": LOOT_TICKS,
                        }
                        break
        elif input_data.get("action") == "cancel_looting":
            self.loot_timers.pop(player_id, None)

        facing_x = input_data.get("facingX")
        facing_y = input_data.get("facingY")
        if facing_x is not None and facing_y is not None:
            player.facing_x = float(facing_x)
            player.facing_y = float(facing_y)

    def craft_item(self, player_id: str, item_id: str) -> None:
        """Attempt to craft ``item_id`` for the specified player."""

        from .world import craft_item as _craft

        player = self.state.players.get(player_id)
        if not player:
            return
        _craft(player, item_id)

    def use_item(self, player_id: str, item_id: str) -> None:
        """Use ``item_id`` from the player's inventory."""

        from .world import use_item as _use

        player = self.state.players.get(player_id)
        if not player:
            return
        _use(player, item_id)

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
