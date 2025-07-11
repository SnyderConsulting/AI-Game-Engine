import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.game.manager import manager


def test_websocket_connection():
    with TestClient(app) as client:
        game_id = manager.create_game_session()
        with client.websocket_connect(f"/ws/game/{game_id}") as ws:
            welcome = ws.receive_json()
            assert welcome["type"] == "welcome"
            assert "playerId" in welcome


def test_update_player_state_via_websocket():
    with TestClient(app) as client:
        game_id = manager.create_game_session()
        with client.websocket_connect(f"/ws/game/{game_id}") as ws:
            welcome = ws.receive_json()
            player_id = welcome["playerId"]

            start_x = manager.get_session(game_id).state.players[player_id].x
            ws.send_json(
                {
                    "action": "move",
                    "moveX": 2,
                    "moveY": 0,
                    "facingX": 1,
                    "facingY": 0,
                }
            )

            import time

            time.sleep(0.05)
            player = manager.get_session(game_id).state.players[player_id]
            assert player.x == start_x + 2
            assert player.facing_x == 1
            assert player.facing_y == 0


def test_game_state_broadcast():
    with TestClient(app) as client:
        game_id = manager.create_game_session()
        with client.websocket_connect(f"/ws/game/{game_id}") as ws:
            welcome = ws.receive_json()
            player_id = welcome["playerId"]
            ws_obj = manager.get_session(game_id).connections[player_id]

            from unittest.mock import AsyncMock
            import time

            original_send = ws_obj.send_json
            send_spy = AsyncMock(wraps=original_send)
            ws_obj.send_json = send_spy

            time.sleep(0.2)
            assert send_spy.called
            sent_state = send_spy.call_args[0][0]
            assert player_id in sent_state["players"]
            assert "walls" in sent_state
            assert "zombies" in sent_state


def test_loot_container_command():
    with TestClient(app) as client:
        game_id = manager.create_game_session()
        container_id = manager.get_session(game_id).state.containers[0].id
        with client.websocket_connect(f"/ws/game/{game_id}") as ws:
            ws.receive_json()
            ws.send_json({"action": "loot", "containerId": container_id})
            import time

            time.sleep(0.05)
            cont = manager.get_session(game_id).state.containers[0]
            assert cont.opened is True
            assert cont.item is not None
