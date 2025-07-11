import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.game.manager import manager


def test_websocket_connection():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/game"):
            pass


def test_update_player_state_via_websocket():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/game") as ws:
            player_id = next(iter(manager.state.players))
            ws.send_json(
                {"action": "move", "direction": "right", "facingX": 1, "facingY": 0}
            )
            import time

            time.sleep(0.05)
            player = manager.state.players[player_id]
            assert player.x == 5
            assert player.facing == "right"


def test_game_state_broadcast():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/game"):
            player_id = next(iter(manager.state.players))
            ws_obj = manager.connections[player_id]

            from unittest.mock import AsyncMock
            import time

            original_send = ws_obj.send_json
            send_spy = AsyncMock(wraps=original_send)
            ws_obj.send_json = send_spy

            time.sleep(0.2)
            assert send_spy.called
