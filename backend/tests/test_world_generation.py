import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.game.manager import GameSession


def test_world_generated_on_session_create():
    session = GameSession()
    assert len(session.state.walls) > 0
    assert len(session.state.zombies) > 0
    assert len(session.state.containers) > 0
    assert session.state.containers[0].id
