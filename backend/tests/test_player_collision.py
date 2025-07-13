import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.game.manager import GameSession
from app.game.world import create_wall, SEGMENT_SIZE
from app.game.models import PlayerState


def test_player_movement_blocked_by_wall():
    session = GameSession()
    session.state.width = SEGMENT_SIZE * 3
    session.state.height = SEGMENT_SIZE * 2
    session.state.walls = [create_wall(1, 0)]
    session.state.players = {"p": PlayerState(x=SEGMENT_SIZE - 10, y=SEGMENT_SIZE / 2)}

    session.update_player_state(
        "p", {"action": "move", "moveX": 20, "moveY": 0}
    )
    player = session.state.players["p"]
    assert player.x == SEGMENT_SIZE - 10


def test_player_movement_blocked_by_bounds():
    session = GameSession()
    session.state.width = SEGMENT_SIZE * 2
    session.state.height = SEGMENT_SIZE * 2
    session.state.walls = []
    session.state.players = {"p": PlayerState(x=5, y=5)}
    session.update_player_state("p", {"action": "move", "moveX": -10, "moveY": 0})
    player = session.state.players["p"]
    assert player.x >= 0
