import os
import sys
import time

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
        session = manager.get_session(game_id)
        with client.websocket_connect(f"/ws/game/{game_id}") as ws:
            welcome = ws.receive_json()
            player_id = welcome["playerId"]
            player = session.state.players[player_id]
            cont = session.state.containers[0]
            player.x, player.y = cont.x, cont.y
            ws.send_json({"action": "start_looting", "containerId": container_id})

            session = manager.get_session(game_id)
            import time

            for _ in range(50):
                if player_id in session.loot_timers:
                    break
                time.sleep(0.02)
            session.loot_timers[player_id]["ticks"] = 1
            session.update_world()
            cont = manager.get_session(game_id).state.containers[0]
            assert cont.opened is True
            assert cont.item is not None
            player_state = manager.get_session(game_id).state.players[player_id]
            assert cont.item in player_state.inventory


def test_loot_cancel_command():
    with TestClient(app) as client:
        game_id = manager.create_game_session()
        container = manager.get_session(game_id).state.containers[0]
        session = manager.get_session(game_id)
        with client.websocket_connect(f"/ws/game/{game_id}") as ws:
            welcome = ws.receive_json()
            player_id = welcome["playerId"]
            player = session.state.players[player_id]
            player.x, player.y = container.x, container.y
            ws.send_json({"action": "start_looting", "containerId": container.id})

            for _ in range(50):
                if player_id in session.loot_timers:
                    break
                time.sleep(0.02)

            ws.send_json({"action": "cancel_looting"})
            time.sleep(0.05)
            assert player_id not in session.loot_timers
            session.update_world()
            cont = manager.get_session(game_id).state.containers[0]
            assert cont.opened is False


def test_loot_shelf_command():
    with TestClient(app) as client:
        game_id = manager.create_game_session()
        shelf = manager.get_session(game_id).state.walls[0]
        session = manager.get_session(game_id)
        with client.websocket_connect(f"/ws/game/{game_id}") as ws:
            welcome = ws.receive_json()
            player_id = welcome["playerId"]
            player = session.state.players[player_id]
            # position player next to shelf edge
            player.x = shelf.x + shelf.size + 1
            player.y = shelf.y + shelf.size / 2
            ws.send_json({"action": "start_looting"})

            for _ in range(50):
                if player_id in session.loot_timers:
                    break
                time.sleep(0.02)
            session.loot_timers[player_id]["ticks"] = 1
            session.update_world()
            shelf_state = manager.get_session(game_id).state.walls[0]
            assert shelf_state.opened is True
            if shelf_state.item:
                player_state = manager.get_session(game_id).state.players[player_id]
                assert shelf_state.item in player_state.inventory
