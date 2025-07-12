import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.game.manager import manager


def test_create_game_endpoint():
    with TestClient(app) as client:
        response = client.post("/api/games")
        assert response.status_code == 200
        data = response.json()
        assert "gameId" in data
        assert manager.get_session(data["gameId"]) is not None
