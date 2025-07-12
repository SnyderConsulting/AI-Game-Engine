from fastapi import APIRouter

from ..game.manager import manager

router = APIRouter(prefix="/api")


@router.post("/games")
async def create_game():
    """Create a new game session and return its ID."""

    game_id = manager.create_game_session()
    return {"gameId": game_id}
