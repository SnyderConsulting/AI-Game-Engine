import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)


def test_new_game():
    response = client.post("/tictactoe/new")
    assert response.status_code == 200
    data = response.json()
    assert len(data["board"]) == 9
    assert data["winner"] is None


def test_make_move():
    # start a game
    response = client.post("/tictactoe/new")
    game = response.json()
    game_id = game["id"]

    # make a move
    move_resp = client.post(
        "/tictactoe/move",
        json={"game_id": game_id, "position": 0},
    )
    assert move_resp.status_code == 200
    data = move_resp.json()
    assert data["board"][0] == "X"
